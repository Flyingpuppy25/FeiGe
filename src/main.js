const { app, BrowserWindow, dialog, ipcMain, safeStorage, shell, net, Menu } = require('electron');
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const { pathToFileURL } = require('url');
const { spawn } = require('child_process');
const crypto = require('crypto');
const archiver = require('archiver');
const { exportHtml, exportStoryboardXlsx, exportScriptDocx, exportAll } = require('./exporters');
const { scanVideo } = require('./detection');

const portableRoot = path.dirname(process.execPath);
if (process.platform === 'darwin') app.setName('FeiGe');
if (app.isPackaged && process.platform === 'win32') app.setPath('userData', path.join(portableRoot, 'FeiGeData'));

let win;
let analysisController = null;
let uiLocale = 'zh-CN';
const projectSaveQueues = new Map();
const dataRoot = () => path.join(app.getPath('userData'), 'workspace');
const projectsRoot = () => path.join(dataRoot(), 'projects');
const researchRoot = () => path.join(dataRoot(), 'research');
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json');
const workspaceVersionFile = () => path.join(dataRoot(), '.schema-version');
const PROJECT_SCHEMA_VERSION = 4;
const UI_SMOKE_PROJECT_ID = 'ui-smoke-fixture';

function normalizeUiLocale(locale) {
  return String(locale || '').toLowerCase().startsWith('zh') ? 'zh-CN' : 'en-US';
}

const nativeDialogCopy = {
  'zh-CN': {
    chooseVideoTitle: '选择视频',
    videoFiles: '视频文件',
    saveScriptTitle: '保存 Word 剧本',
    saveStoryboardTitle: '保存 Excel 分镜表',
    saveHtmlTitle: '保存 HTML 成品页',
    wordDocument: 'Word 文档',
    excelWorkbook: 'Excel 工作簿',
    offlineWebpage: '离线网页',
    chooseExportFolder: '选择成品保存位置'
  },
  'en-US': {
    chooseVideoTitle: 'Choose a video',
    videoFiles: 'Video files',
    saveScriptTitle: 'Save Word screenplay',
    saveStoryboardTitle: 'Save Excel storyboard',
    saveHtmlTitle: 'Save HTML presentation',
    wordDocument: 'Word document',
    excelWorkbook: 'Excel workbook',
    offlineWebpage: 'Offline webpage',
    chooseExportFolder: 'Choose where to save the deliverables'
  }
};

function nativeDialogText(key) {
  return nativeDialogCopy[uiLocale][key];
}

const OLD_SHOT_PROMPT = '你是专业影视拆片师。分析这一帧，严格输出 JSON：{scene, timeOfDay, interiorExterior, shotSize, angle, movement, description, dialogue, sound}。使用中文，无法判断的字段留空。';
const DEFAULT_SHOT_PROMPT = `你是专业影视拆片师。请分析输入的短视频片段或连续关键帧，并且只输出一个 JSON 对象。
字段必须为 scene、timeOfDay、interiorExterior、shotSize、angle、movement、description、dialogue、sound。
分类必须规范：shotSize 只能从“极特写、特写、近景、中近景、中景、中远景、全景”选择；angle 只能从“平视角、低角度、俯视、仰视”选择；movement 只能从“静态镜头、跟拍镜头、手持镜头、切镜”选择。
description 使用 180–260 个中文字符，客观描述主体、动作、构图、光线、色彩、氛围和叙事作用；sound 必须描述可听见或合理可辨的声音；dialogue 记录清晰台词、旁白或画面字幕，无法确认时留空，不要编造。`;
const DEFAULT_SCRIPT_PROMPT = `根据完整分镜整理为可拍摄的专业中文剧本 Markdown。严格采用以下结构：
# 剧本
源视频: 文件名
时长: HH:MM:SS
场景数: 数字

## 场景名 日/夜/内/外 (HH:MM:SS)
人物：人物列表
△动作、画面与调度
角色名：台词
旁白：旁白
【字幕：画面文字】

合并连续同场景镜头，但不得遗漏关键动作、台词、字幕和声音。不要添加解释或代码块。`;

const defaults = {
  providers: {
    openai: { label: 'OpenAI', type: 'openai', baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini', apiKey: '' },
    anthropic: { label: 'Claude', type: 'anthropic', baseUrl: 'https://api.anthropic.com/v1', model: 'claude-sonnet-4-20250514', apiKey: '' },
    gemini: { label: 'Gemini', type: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-3.1-flash-lite', apiKey: '' },
    deepseek: { label: 'DeepSeek', type: 'openai', baseUrl: 'https://api.deepseek.com/v1', model: 'deepseek-chat', apiKey: '' },
    qwen: { label: '通义千问', type: 'openai', baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-plus', apiKey: '' }
  },
  activeProvider: 'gemini',
  detectionMode: 'hybrid',
  hardCutFloor: 5.5,
  relativeMultiplier: 8,
  classicThreshold: 0.08,
  minGap: 0.5,
  maxShots: 6000,
  concurrency: 3,
  settingsVersion: 3,
  autoAnalyzeAfterDetection: true,
  shotPrompt: DEFAULT_SHOT_PROMPT,
  scriptPrompt: DEFAULT_SCRIPT_PROMPT
};

function mergeSettings(raw = {}) {
  const merged = { ...defaults, ...raw, providers: { ...defaults.providers, ...(raw.providers || {}) } };
  if (!raw.shotPrompt || raw.shotPrompt === OLD_SHOT_PROMPT) merged.shotPrompt = DEFAULT_SHOT_PROMPT;
  if (!raw.scriptPrompt || raw.scriptPrompt === '根据分镜信息整理为专业中文剧本，包含场次、环境、人物、动作、台词与声音。') merged.scriptPrompt = DEFAULT_SCRIPT_PROMPT;
  merged.detectionMode = merged.detectionMode === 'classic' ? 'classic' : 'hybrid';
  merged.hardCutFloor = Math.max(0.5, Number(merged.hardCutFloor) || defaults.hardCutFloor);
  merged.relativeMultiplier = Math.max(1.2, Number(merged.relativeMultiplier) || defaults.relativeMultiplier);
  merged.classicThreshold = Math.max(0.01, Number(merged.classicThreshold) || defaults.classicThreshold);
  merged.maxShots = Math.max(2, Math.min(6000, Number(merged.maxShots) || defaults.maxShots));
  merged.settingsVersion = 3;
  return merged;
}

async function initializeWorkspace() {
  const current = Number(await fsp.readFile(workspaceVersionFile(), 'utf8').catch(() => 0));
  if (current !== PROJECT_SCHEMA_VERSION) {
    await fsp.rm(dataRoot(), { recursive: true, force: true });
    await fsp.mkdir(dataRoot(), { recursive: true });
    await fsp.writeFile(workspaceVersionFile(), String(PROJECT_SCHEMA_VERSION), 'utf8');
  }
  await fsp.mkdir(projectsRoot(), { recursive: true });
  await fsp.mkdir(researchRoot(), { recursive: true });
}

async function createUiSmokeFixture() {
  const smokeFrame=path.join(__dirname,'..','assets','smoke-frame.jpg');
  const now=Date.now(),item={
    id:UI_SMOKE_PROJECT_ID,kind:'project',name:'FeiGe 界面检查',videoPath:smokeFrame,createdAt:now,updatedAt:now,duration:12,status:'analyzed',
    videoMeta:{width:1920,height:1080,fps:25,bitrate:8000000,size:12000000,codec:'h264',duration:12},
    sceneScores:Array.from({length:61},(_,index)=>({time:index/5,score:index%14===0?.32:.018+Math.abs(Math.sin(index*.7))*.035,luma:.45})),
    detection:{mode:'hybrid',detectorCounts:{'hard-cut':4,'white-flash':1,'fade-in':1,dissolve:1},maxShots:6000},
    shots:[
      {id:'smoke-shot-1',index:1,start:0,end:5,startTc:'00:00:00',endTc:'00:00:05',frame:'frame_00001.jpg',scene:'客厅',timeOfDay:'日',interiorExterior:'内',shotSize:'中景',angle:'平视角',movement:'静态镜头',description:'人物坐在窗边整理桌上的照片，柔和日光从画面左侧进入。',dialogue:'今天从这里开始。',sound:'室内环境声',analysisStatus:'success'},
      {id:'smoke-shot-2',index:2,start:5,end:12,startTc:'00:00:05',endTc:'00:00:12',frame:'frame_00002.jpg',scene:'街道',timeOfDay:'夜',interiorExterior:'外',shotSize:'全景',angle:'低角度',movement:'跟拍镜头',description:'人物沿着雨后的街道向前走，路面反射暖色灯光。',dialogue:'',sound:'脚步与远处车流',analysisStatus:'success'}
    ],
    script:'# 剧本\n\n## 客厅 日/内 (00:00:00)\n人物：主角\n△主角在窗边整理照片。\n主角：今天从这里开始。\n\n## 街道 夜/外 (00:00:05)\n人物：主角\n△主角走入雨后的街道。',
    activeScriptVersionId:'smoke-v2',
    scriptVersions:[
      {id:'smoke-v2',createdAt:now,providerId:'gemini',providerLabel:'Gemini',model:'gemini-3.1-flash-lite',mediaMode:'video'},
      {id:'smoke-v1',createdAt:now-3600000,providerId:'openai',providerLabel:'OpenAI',model:'gpt-4.1-mini',mediaMode:'keyframes'}
    ]
  };
  item.scriptScenes=splitScriptScenes(item.script);item.storyboard=storyboardMarkdown(item);
  const frameDir=path.join(projectDir(item),'frames');await fsp.mkdir(frameDir,{recursive:true});
  const source=smokeFrame;
  if(fs.existsSync(source)){await fsp.copyFile(source,path.join(frameDir,'frame_00001.jpg'));await fsp.copyFile(source,path.join(frameDir,'frame_00002.jpg'));}
  await saveProject(item);
  await fsp.writeFile(scriptVersionPath(item,'smoke-v1'),item.script.replace('今天从这里开始。','旧版本台词。'),'utf8');
  await writeJson(path.join(projectDir(item),'versions.json'),item.scriptVersions);
  const research={...item,id:'ui-smoke-research',kind:'research',name:'FeiGe 风格研究检查',script:'# 风格研究\n\n## 色彩与光线\n暖色自然光与低饱和环境色形成对比。',scriptVersions:[{id:'research-v1',createdAt:now,providerId:'gemini',providerLabel:'Gemini',model:'gemini-3.1-flash-lite',mediaMode:'research-collage'}],activeScriptVersionId:'research-v1',researchWorkflow:{current:'refine',status:'done',stages:{prepare:{status:'done',detail:'准备完成'},split:{status:'done',detail:'已拆解 2 个镜头'},collage:{status:'done',detail:'镜头拼图已生成'},refine:{status:'done',detail:'风格研究已完成'}}}};
  research.scriptScenes=splitScriptScenes(research.script);research.storyboard=storyboardMarkdown(research);
  const researchFrames=path.join(projectDir(research),'frames');await fsp.mkdir(researchFrames,{recursive:true});
  if(fs.existsSync(source)){await fsp.copyFile(source,path.join(researchFrames,'frame_00001.jpg'));await fsp.copyFile(source,path.join(researchFrames,'frame_00002.jpg'));}
  await saveProject(research);
}

async function readJson(file, fallback = null) {
  try { return JSON.parse(await fsp.readFile(file, 'utf8')); } catch { return fallback; }
}

async function writeJson(file, value) {
  await fsp.mkdir(path.dirname(file), { recursive: true });
  await fsp.writeFile(file, JSON.stringify(value, null, 2), 'utf8');
}

function encrypt(value) {
  if (!value) return '';
  if (safeStorage.isEncryptionAvailable()) return `safe:${safeStorage.encryptString(value).toString('base64')}`;
  return `plain:${Buffer.from(value, 'utf8').toString('base64')}`;
}

function decrypt(value) {
  if (!value) return '';
  try {
    if (value.startsWith('safe:')) return safeStorage.decryptString(Buffer.from(value.slice(5), 'base64'));
    if (value.startsWith('plain:')) return Buffer.from(value.slice(6), 'base64').toString('utf8');
  } catch {}
  return '';
}

async function loadSettings(withSecrets = false) {
  const saved = mergeSettings(await readJson(settingsFile(), {}));
  for (const p of Object.values(saved.providers)) {
    const encrypted = p.apiKey || '';
    const decrypted = decrypt(encrypted);
    p.hasApiKey = Boolean(encrypted && decrypted);
    p.apiKeyError = Boolean(encrypted && !decrypted);
    p.apiKey = withSecrets ? decrypted : '';
  }
  return saved;
}

function toolPath(name) {
  const executable = process.platform === 'win32' ? `${name}.exe` : name;
  const bundled = path.join(process.resourcesPath || '', 'vendor', executable);
  const development = path.join(__dirname, '..', 'vendor', `${process.platform}-${process.arch}`, executable);
  if (app.isPackaged && fs.existsSync(bundled)) return bundled;
  if (fs.existsSync(development)) return development;
  return fs.existsSync(bundled) ? bundled : executable;
}

function run(command, args, onLine) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { windowsHide: true });
    let out = '', err = '';
    child.stdout.on('data', d => { out += d; onLine?.(String(d)); });
    child.stderr.on('data', d => { err += d; onLine?.(String(d)); });
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve({ out, err }) : reject(new Error(err || `${command} 退出码 ${code}`)));
  });
}

async function durationOf(video) {
  const { out } = await run(toolPath('ffprobe'), ['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1', video]);
  return Number(out.trim());
}

async function videoInfo(video) {
  const { out } = await run(toolPath('ffprobe'), ['-v','error','-select_streams','v:0','-show_entries','stream=width,height,r_frame_rate,codec_name,bit_rate:format=duration,bit_rate,size','-of','json',video]);
  const data=JSON.parse(out), stream=data.streams?.[0]||{};
  const [fpsN,fpsD]=String(stream.r_frame_rate||'0/1').split('/').map(Number);
  return {
    width:Number(stream.width),
    height:Number(stream.height),
    duration:Number(data.format?.duration),
    fps:fpsD ? fpsN/fpsD : 0,
    bitrate:Number(data.format?.bit_rate||stream.bit_rate||0),
    size:Number(data.format?.size||0),
    codec:String(stream.codec_name||'')
  };
}

function timecode(sec) {
  sec = Math.max(0, Number(sec) || 0);
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = Math.floor(sec % 60);
  return [h,m,s].map(v => String(v).padStart(2,'0')).join(':');
}

async function extractFrame(video, at, output) {
  await run(toolPath('ffmpeg'), ['-y','-ss',String(Math.max(0, at)),'-i',video,'-frames:v','1','-q:v','3',output]);
}

async function listKind(root) {
  await fsp.mkdir(root, { recursive: true });
  const ids = await fsp.readdir(root);
  const items = [];
  for (const id of ids) {
    const item = await readJson(path.join(root, id, 'project.json'));
    if (item) items.push(item);
  }
  return items.sort((a,b) => b.updatedAt - a.updatedAt);
}

async function createProject(kind, videoPath, name) {
  const id = crypto.randomUUID();
  const root = kind === 'research' ? researchRoot() : projectsRoot();
  const dir = path.join(root, id);
  await fsp.mkdir(path.join(dir, 'frames'), { recursive: true });
  const now = Date.now();
  const item = { id, kind, name: name || path.basename(videoPath, path.extname(videoPath)), videoPath, createdAt: now, updatedAt: now, status: 'new', shots: [], script: '', storyboard: '' };
  await writeJson(path.join(dir, 'project.json'), item);
  return item;
}

function projectRoot(kind) { return kind === 'research' ? researchRoot() : projectsRoot(); }

function projectDirFromIdentity(kind, id) {
  const root = path.resolve(projectRoot(kind));
  const identity = String(id || '');
  if (!/^[a-zA-Z0-9_-]+$/.test(identity)) throw new Error('项目标识无效');
  const dir = path.resolve(root, identity);
  if (!dir.startsWith(`${root}${path.sep}`)) throw new Error('项目路径无效');
  return dir;
}

function projectDir(item) { return projectDirFromIdentity(item.kind, item.id); }

async function projectByIdentity(payload) {
  const kind = payload?.kind === 'research' ? 'research' : 'project';
  const file = path.join(projectDirFromIdentity(kind, payload?.id), 'project.json');
  const item = await readJson(file);
  if (!item) throw new Error('项目不存在或已被删除');
  return item;
}

async function renameProject(payload) {
  const item = await projectByIdentity(payload);
  const name = String(payload?.name || '').trim().replace(/[\r\n\t]+/g, ' ').slice(0, 120);
  if (!name) throw new Error('项目名称不能为空');
  item.name = name;
  return saveProject(item);
}

async function deleteProjectByIdentity(payload) {
  const item = await projectByIdentity(payload);
  const dir = projectDir(item);
  const queued = projectSaveQueues.get(path.join(dir, 'project.json'));
  if (queued) await queued.catch(() => {});
  await fsp.rm(dir, { recursive:true, force:true });
  return { ok:true, id:item.id, kind:item.kind };
}

function scriptVersionPath(item, versionId) {
  return path.join(projectDir(item), 'scripts', `${String(versionId).replace(/[^a-zA-Z0-9_-]/g, '')}.md`);
}

async function saveProject(item) {
  item.updatedAt = Date.now();
  const dir = projectDir(item);
  const file = path.join(dir, 'project.json');
  const snapshot = JSON.stringify(item, null, 2);
  const script = item.script == null ? null : String(item.script);
  const storyboard = item.storyboard == null ? null : String(item.storyboard);
  const activeScriptVersionId = item.activeScriptVersionId;
  const previous = projectSaveQueues.get(file) || Promise.resolve();
  const current = previous.catch(()=>{}).then(async()=>{
    await fsp.mkdir(dir, { recursive:true });
    await fsp.writeFile(file, snapshot, 'utf8');
    if (script != null) await fsp.writeFile(path.join(dir, 'script.md'), script, 'utf8');
    if (script != null && activeScriptVersionId) {
      await fsp.mkdir(path.join(dir, 'scripts'), { recursive:true });
      await fsp.writeFile(scriptVersionPath(item, activeScriptVersionId), script, 'utf8');
    }
    if (storyboard != null) await fsp.writeFile(path.join(dir, 'storyboard.md'), storyboard, 'utf8');
  });
  projectSaveQueues.set(file, current);
  await current;
  if (projectSaveQueues.get(file) === current) projectSaveQueues.delete(file);
  return item;
}

function sendProgress(message, progress = null, extra = {}) { win?.webContents.send('task-progress', { message, progress, ...extra }); }

async function detectScenes(item, options) {
  const settings = await loadSettings(true);
  const detectionOptions = {
    mode: options?.mode ?? settings.detectionMode,
    hardCutFloor: options?.hardCutFloor ?? settings.hardCutFloor,
    relativeMultiplier: options?.relativeMultiplier ?? settings.relativeMultiplier,
    classicThreshold: options?.classicThreshold ?? settings.classicThreshold,
    minGap: options?.minGap ?? settings.minGap,
    maxShots: options?.maxShots ?? settings.maxShots
  };
  sendProgress('正在分析场景变化…', 0.05);
  const info = await videoInfo(item.videoPath);
  if (!info.width || !info.height || !info.duration) throw new Error('无法读取视频尺寸或时长');
  const scan = await scanVideo({
    ffmpegPath: toolPath('ffmpeg'),
    video: item.videoPath,
    duration: info.duration,
    options: detectionOptions,
    onProgress: progress => sendProgress(`正在分析场景变化 ${Math.round(progress * 100)}%`, 0.05 + progress * 0.25, options?.progressStage ? { stage:options.progressStage } : {})
  });
  const duration=info.duration, matches=scan.cuts.map(cut => cut.time), minGap=scan.options.minGap;
  const points = [0];
  for (const t of matches) if (t - points.at(-1) >= minGap && t < duration - 0.2) points.push(t);
  points.push(duration);
  const dir = projectDir(item), shots = [];
  for (let i=0;i<points.length-1;i++) {
    const start = points[i], end = points[i+1], at = Math.min(end - 0.05, start + Math.max(0.1, (end-start)/2));
    const frameName = `frame_${String(i+1).padStart(5,'0')}.jpg`;
    sendProgress(`正在提取代表帧 ${i+1}/${points.length-1}`, 0.1 + 0.75*(i+1)/(points.length-1));
    await extractFrame(item.videoPath, at, path.join(dir,'frames',frameName));
    shots.push({ id: crypto.randomUUID(), index:i+1, start, end, startTc:timecode(start), endTc:timecode(end), frame:frameName, scene:'', timeOfDay:'', interiorExterior:'', shotSize:'', angle:'', movement:'', description:'', dialogue:'', sound:'' });
  }
  item.duration = duration; item.videoMeta = { ...info, duration }; item.shots = shots; item.status = 'segmented';
  item.sceneScores = scan.samples.map(sample => ({ time:sample.time, score:sample.score, luma:sample.luma }));
  item.detection = {
    mode: scan.options.mode,
    options: scan.options,
    detectorCounts: scan.detectorCounts,
    candidates: scan.cuts,
    classicStats: scan.classicStats,
    maxShots: scan.options.maxShots
  };
  item.storyboard = storyboardMarkdown(item);
  await saveProject(item);
  sendProgress('拆镜完成', 1);
  return item;
}

function storyboardMarkdown(item) {
  const lines = ['# FeiGe 分镜表',''];
  for (const s of item.shots || []) {
    lines.push(`## 镜 ${s.index} | ${s.startTc} - ${s.endTc}`,'');
    lines.push(`- 场景：${[s.scene,s.timeOfDay,s.interiorExterior].filter(Boolean).join(' ')}`);
    lines.push(`- 景别/角度/运动：${[s.shotSize,s.angle,s.movement].filter(Boolean).join(' · ')}`);
    lines.push(`- 画面：${s.description || ''}`);
    lines.push(`- 台词：${s.dialogue || ''}`);
    lines.push(`- 声音：${s.sound || ''}`,'');
  }
  return lines.join('\n');
}

function stripCodeFence(text) {
  return String(text).replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
}

const SHOT_RESPONSE_SCHEMA = {
  type:'OBJECT',
  properties:{
    scene:{type:'STRING'},
    timeOfDay:{type:'STRING'},
    interiorExterior:{type:'STRING'},
    shotSize:{type:'STRING',enum:['极特写','特写','近景','中近景','中景','中远景','全景']},
    angle:{type:'STRING',enum:['平视角','低角度','俯视','仰视']},
    movement:{type:'STRING',enum:['静态镜头','跟拍镜头','手持镜头','切镜']},
    description:{type:'STRING'},
    dialogue:{type:'STRING'},
    sound:{type:'STRING'}
  },
  required:['scene','timeOfDay','interiorExterior','shotSize','angle','movement','description','dialogue','sound']
};

const sleep = ms => new Promise(resolve=>setTimeout(resolve,ms));

function modelError(message, retryable = false) {
  const error = new Error(message);
  error.retryable = retryable;
  return error;
}

function safeText(value, max = 600) {
  const text = typeof value === 'string' ? value : value == null ? '' : JSON.stringify(value);
  return text.replace(/([?&]key=)[^&\s]+/gi,'$1***').replace(/(Bearer\s+)[^\s]+/gi,'$1***').slice(0,max);
}

async function httpError(response) {
  let message = '';
  try {
    const body = await response.text();
    try { const parsed=JSON.parse(body); message=parsed.error?.message||parsed.message||body; }
    catch { message=body; }
  } catch {}
  return modelError(`接口返回 ${response.status}${message?`：${safeText(message,360)}`:''}`, response.status===408||response.status===409||response.status===429||response.status>=500);
}

function normalizedMedia(media) {
  if (!media) return { images:[], video:null };
  if (typeof media === 'string') return { images:[{dataUrl:media,label:''}], video:null };
  const images = Array.isArray(media.images) ? media.images.filter(Boolean).map(image => typeof image === 'string' ? { dataUrl:image, label:'' } : image) : [];
  return { images, video:media.video||null };
}

async function fetchWithTimeout(url, init, timeoutMs = 120000) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),timeoutMs);
  try { return await net.fetch(url,{...init,signal:controller.signal}); }
  catch (error) {
    if (error?.name === 'AbortError') throw modelError(`接口请求超过 ${Math.round(timeoutMs/1000)} 秒`,true);
    throw modelError(`网络请求失败：${safeText(error?.message||error)}`,true);
  } finally { clearTimeout(timer); }
}

async function modelRequest(provider, prompt, media, options = {}) {
  const key=provider.apiKey;
  const base=String(provider.baseUrl||'').replace(/\/$/,'');
  const model=String(provider.model||'').trim();
  if(!base) throw modelError(`${provider.label||'当前接口'} 未填写 Base URL`);
  if(!model) throw modelError(`${provider.label||'当前接口'} 未填写模型名称`);
  const {images,video}=normalizedMedia(media);
  if(provider.type==='anthropic'){
    const content=[{type:'text',text:prompt}];
    for(const image of images){if(image.label)content.push({type:'text',text:image.label});const[meta,data]=image.dataUrl.split(',');content.push({type:'image',source:{type:'base64',media_type:meta.match(/data:(.*?);/)?.[1]||'image/jpeg',data}});}
    const response=await fetchWithTimeout(`${base}/messages`,{method:'POST',headers:{'content-type':'application/json','x-api-key':key,'anthropic-version':'2023-06-01'},body:JSON.stringify({model,max_tokens:options.maxTokens||4096,messages:[{role:'user',content}]})},options.timeoutMs);
    if(!response.ok)throw await httpError(response);
    const data=await response.json(),text=data.content?.map(x=>x.text||'').join('').trim();
    if(!text)throw modelError(`模型未返回文字内容（${safeText(data.stop_reason||'empty response')}）`);
    return text;
  }
  if(provider.type==='gemini'){
    const parts=[{text:prompt}];
    if(video){const[meta,data]=video.split(',');parts.push({inlineData:{mimeType:meta.match(/data:(.*?);/)?.[1]||'video/mp4',data}});}
    for(const image of images){if(image.label)parts.push({text:image.label});const[meta,data]=image.dataUrl.split(',');parts.push({inlineData:{mimeType:meta.match(/data:(.*?);/)?.[1]||'image/jpeg',data}});}
    const generationConfig={temperature:options.temperature??0.25,maxOutputTokens:options.maxTokens||4096};
    if(options.jsonSchema){generationConfig.responseMimeType='application/json';generationConfig.responseSchema=options.jsonSchema;}
    const response=await fetchWithTimeout(`${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts}],generationConfig})},options.timeoutMs);
    if(!response.ok)throw await httpError(response);
    const data=await response.json(),candidate=data.candidates?.[0];
    const text=candidate?.content?.parts?.map(x=>x.text||'').join('').trim();
    if(!text){const reason=data.promptFeedback?.blockReason||candidate?.finishReason||'empty response';throw modelError(`模型未返回文字内容（${safeText(reason)}）`);}
    return text;
  }
  const content=[{type:'text',text:prompt}];
  for(const image of images){if(image.label)content.push({type:'text',text:image.label});content.push({type:'image_url',image_url:{url:image.dataUrl}});}
  const body={model,messages:[{role:'user',content:images.length?content:prompt}],temperature:options.temperature??0.25};
  if(options.jsonSchema) body.response_format={type:'json_object'};
  const response=await fetchWithTimeout(`${base}/chat/completions`,{method:'POST',headers:{'content-type':'application/json','authorization':`Bearer ${key}`},body:JSON.stringify(body)},options.timeoutMs);
  if(!response.ok)throw await httpError(response);
  const data=await response.json(),text=data.choices?.[0]?.message?.content?.trim();
  if(!text)throw modelError(`模型未返回文字内容（${safeText(data.choices?.[0]?.finish_reason||'empty response')}）`);
  return text;
}

async function callModel(provider, messages, media, options = {}) {
  if(!provider)throw modelError('当前模型接口不存在，请重新选择接口');
  if(provider.apiKeyError)throw modelError('本机无法解密已保存的 API Key，请在设置中重新填写并保存');
  if(!provider.apiKey)throw modelError(`请先在设置中填写 ${provider.label||'当前接口'} API Key`);
  const prompt=messages.map(m=>m.content).filter(Boolean).join('\n\n');
  const attempts=Math.max(1,Number(options.attempts||4));
  let lastError;
  for(let attempt=1;attempt<=attempts;attempt++){
    try{return await modelRequest(provider,prompt,media,options);}
    catch(error){lastError=error;if(error.retryable===false||attempt===attempts)break;await sleep(Math.min(12000,900*2**(attempt-1)+Math.random()*500));}
  }
  throw lastError||modelError('模型调用失败');
}

function parseShotJson(text) {
  const clean=stripCodeFence(text);
  const candidates=[clean,clean.match(/\{[\s\S]*\}/)?.[0]].filter(Boolean);
  for(const candidate of candidates){
    try{const parsed=JSON.parse(candidate);return Array.isArray(parsed)?parsed[0]:parsed.result||parsed.shot||parsed;}
    catch{}
  }
  throw modelError('模型返回的内容不是有效 JSON');
}

function normalizeShotSize(value) {
  const v=String(value||'');
  if(/极.*特|大特写/.test(v))return '极特写';
  if(/中近/.test(v))return '中近景';
  if(/中远/.test(v))return '中远景';
  if(/特写/.test(v))return '特写';
  if(/近景|近距/.test(v))return '近景';
  if(/全景|远景|大全/.test(v))return '全景';
  return '中景';
}

function normalizeAngle(value) {
  const v=String(value||'');
  if(/俯|鸟瞰|高角度/.test(v))return '俯视';
  if(/仰/.test(v))return '仰视';
  if(/低角度|低机位/.test(v))return '低角度';
  return '平视角';
}

function normalizeMovement(value) {
  const v=String(value||'');
  if(/手持|晃动/.test(v))return '手持镜头';
  if(/跟|追|随|移动|推|拉|摇|移|环绕/.test(v))return '跟拍镜头';
  if(/切/.test(v))return '切镜';
  return '静态镜头';
}

function normalizeShotResult(raw) {
  const text=value=>Array.isArray(value)?value.join('、'):value&&typeof value==='object'?JSON.stringify(value):String(value||'').trim();
  const result={
    scene:text(raw.scene||raw.location||raw.setting),
    timeOfDay:text(raw.timeOfDay||raw.time||raw.dayNight),
    interiorExterior:text(raw.interiorExterior||raw.interior||raw.interiorExteriorType),
    shotSize:normalizeShotSize(raw.shotSize||raw.shotType||raw.scale),
    angle:normalizeAngle(raw.angle||raw.cameraAngle),
    movement:normalizeMovement(raw.movement||raw.cameraMove||raw.cameraMovement),
    description:text(raw.description||raw.visualDescription||raw.content),
    dialogue:text(raw.dialogue||raw.subtitle||raw.speech),
    sound:text(raw.sound||raw.soundEffect||raw.audio)
  };
  if(!result.scene)result.scene='未识别场景';
  if(!result.timeOfDay)result.timeOfDay='日';
  if(!result.interiorExterior)result.interiorExterior='外';
  return result;
}

function dataUrl(mime,buffer){return `data:${mime};base64,${buffer.toString('base64')}`;}

function splitScriptScenes(script) {
  const text = String(script || '').trim();
  if (!text) return [];
  const lines = text.split(/\r?\n/);
  const preamble = [];
  const scenes = [];
  let current = null;
  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (current) scenes.push(current.join('\n').trim());
      current = [line];
    } else if (current) current.push(line);
    else preamble.push(line);
  }
  if (current) scenes.push(current.join('\n').trim());
  if (!scenes.length) return [text];
  if (preamble.some(line => line.trim())) scenes[0] = `${preamble.join('\n').trim()}\n\n${scenes[0]}`;
  return scenes.filter(Boolean);
}

function joinScriptScenes(scenes) {
  return (Array.isArray(scenes) ? scenes : []).map(scene => String(scene || '').trim()).filter(Boolean).join('\n\n');
}

async function makeUniformScriptFrames(item, limit = 24) {
  const duration = Math.max(0.1, Number(item.duration) || await durationOf(item.videoPath));
  const count = Math.min(limit, Math.max(2, Math.ceil(duration / 2)));
  const dir = path.join(projectDir(item), 'script-frames');
  await fsp.mkdir(dir, { recursive:true });
  const images = [];
  for (let index = 0; index < count; index++) {
    const time = count === 1 ? duration / 2 : Math.min(duration - 0.05, (duration * index) / (count - 1));
    const filename = `script_${String(index + 1).padStart(2, '0')}_${Math.round(time * 1000)}.jpg`;
    const output = path.join(dir, filename);
    if (!fs.existsSync(output)) await run(toolPath('ffmpeg'), ['-y','-ss',String(Math.max(0,time)),'-i',item.videoPath,'-vf','scale=768:-2','-frames:v','1','-q:v','4',output]);
    images.push({ dataUrl:dataUrl('image/jpeg', await fsp.readFile(output)), label:`关键帧 ${String(index + 1).padStart(2, '0')} · 时间戳 ${timecode(time)}` });
  }
  return images;
}

async function makeGeminiScriptVideo(item) {
  const source = item.videoPath;
  const stat = await fsp.stat(source);
  if (path.extname(source).toLowerCase() === '.mp4' && stat.size < 18 * 1024 * 1024) return dataUrl('video/mp4', await fsp.readFile(source));
  const dir = path.join(projectDir(item), 'script-media');
  const output = path.join(dir, 'overview.mp4');
  await fsp.mkdir(dir, { recursive:true });
  if (!fs.existsSync(output)) {
    const duration = Math.max(1, Number(item.duration) || await durationOf(source));
    const totalKbps = Math.floor((14 * 1024 * 8) / duration);
    const audioKbps = 32;
    const videoKbps = Math.max(80, Math.min(600, totalKbps - audioKbps));
    await run(toolPath('ffmpeg'), ['-y','-i',source,'-vf','scale=640:-2','-r','3','-c:v','mpeg4','-b:v',`${videoKbps}k`,'-c:a','aac','-b:a',`${audioKbps}k`,'-movflags','+faststart',output]);
  }
  const outputStat = await fsp.stat(output);
  return outputStat.size < 18 * 1024 * 1024 ? dataUrl('video/mp4', await fsp.readFile(output)) : null;
}

async function makeScriptMedia(item, provider) {
  if (provider.type === 'gemini') {
    try {
      const video = await makeGeminiScriptVideo(item);
      if (video) return { images:[], video, mode:'video' };
    } catch (error) {
      await appendAnalysisLog(item,{level:'warning',message:`剧本视频预处理失败，改用均匀关键帧：${safeText(error.message,240)}`});
    }
  }
  return { images:await makeUniformScriptFrames(item,24), video:null, mode:'keyframes' };
}

async function makeShotMedia(item,shot,provider){
  const image=await fsp.readFile(path.join(projectDir(item),'frames',shot.frame));
  const media={images:[dataUrl('image/jpeg',image)],video:null};
  if(provider.type!=='gemini')return media;
  const clips=path.join(projectDir(item),'clips');
  await fsp.mkdir(clips,{recursive:true});
  const clipPath=path.join(clips,`shot_${String(shot.index).padStart(5,'0')}_${Math.round(shot.start*1000)}_${Math.round(shot.end*1000)}.mp4`);
  try{
    if(!fs.existsSync(clipPath)){
      const clipDuration=Math.max(.2,Math.min(12,Number(shot.end)-Number(shot.start)));
      await run(toolPath('ffmpeg'),['-y','-ss',String(Math.max(0,Number(shot.start))),'-t',String(clipDuration),'-i',item.videoPath,'-vf','scale=640:-2','-r','12','-c:v','mpeg4','-q:v','7','-c:a','aac','-b:a','48k','-movflags','+faststart',clipPath]);
    }
    const stat=await fsp.stat(clipPath);
    if(stat.size>0&&stat.size<18*1024*1024)media.video=dataUrl('video/mp4',await fsp.readFile(clipPath));
  }catch(error){await appendAnalysisLog(item,{level:'warning',shot:shot.index,message:`视频片段提取失败，已改用关键帧：${safeText(error.message,240)}`});}
  return media;
}

async function appendAnalysisLog(item,entry){
  const record=JSON.stringify({time:new Date().toISOString(),...entry})+'\n';
  await fsp.mkdir(projectDir(item),{recursive:true});
  await fsp.appendFile(path.join(projectDir(item),'analysis.log'),record,'utf8').catch(()=>{});
}

async function analyzeShotCore(item,shot,settings,provider){
  const media=await makeShotMedia(item,shot,provider);
  try{
    const text=await callModel(provider,[{role:'user',content:settings.shotPrompt}],media,{jsonSchema:SHOT_RESPONSE_SCHEMA,maxTokens:4096});
    const result=normalizeShotResult(parseShotJson(text));
    if(!result.description)throw modelError('结构化结果缺少画面描述');
    return result;
  }catch(firstError){
    await appendAnalysisLog(item,{level:'warning',shot:shot.index,message:`结构化识别失败，执行兼容重试：${safeText(firstError.message,300)}`});
    const fallbackPrompt='请用中文客观、详细描述这个短视频镜头中的场景、主体、动作、构图、光线、色彩、氛围、可见文字与声音。不要输出 JSON，不要猜测敏感属性。';
    const fallbackMedia={images:media.images};
    const description=(await callModel(provider,[{role:'user',content:fallbackPrompt}],fallbackMedia,{attempts:3,maxTokens:2048})).trim();
    if(!description)throw firstError;
    return {scene:'未识别场景',timeOfDay:'日',interiorExterior:'外',shotSize:'中景',angle:'平视角',movement:'静态镜头',description,dialogue:'',sound:'现场环境声'};
  }
}

async function analyzeShot(item,shotId){
  const settings=await loadSettings(true),provider=settings.providers[settings.activeProvider];
  const shot=item.shots.find(s=>s.id===shotId);if(!shot)throw new Error('镜头不存在');
  shot.analysisStatus='running';shot.analysisError='';await saveProject(item);
  try{Object.assign(shot,await analyzeShotCore(item,shot,settings,provider),{analysisStatus:'success',analysisError:'',analyzedAt:Date.now()});}
  catch(error){shot.analysisStatus='failed';shot.analysisError=safeText(error.message,500);await appendAnalysisLog(item,{level:'error',shot:shot.index,message:shot.analysisError});throw error;}
  finally{item.storyboard=storyboardMarkdown(item);await saveProject(item);}
  return item;
}

async function analyzeAllShots(item,mode='all'){
  if(analysisController)throw new Error('已有识别任务正在运行');
  const settings=await loadSettings(true),provider=settings.providers[settings.activeProvider];
  if(!item.shots?.length)throw new Error('请先完成自动拆镜');
  const targets=item.shots.filter(shot=>mode==='failed'?shot.analysisStatus==='failed':mode==='pending'?(shot.analysisStatus!=='success'&&!shot.description):true);
  if(!targets.length)return {item,summary:{total:0,success:0,failed:0,cancelled:false}};
  analysisController={cancelled:false};
  let cursor=0,completed=0,success=0,failed=0;
  const total=targets.length,concurrency=Math.max(1,Math.min(10,Number(settings.concurrency)||3));
  item.status='analyzing';
  for(const shot of targets){shot.analysisStatus='pending';shot.analysisError='';}
  await saveProject(item);
  sendProgress(`准备识别 ${total} 个镜头…`,0);
  async function worker(){
    while(!analysisController.cancelled){
      const index=cursor++;if(index>=targets.length)return;
      const shot=targets[index];shot.analysisStatus='running';
      sendProgress(`AI 识别中 ${completed}/${total} · 当前镜头 #${String(shot.index).padStart(3,'0')}`,completed/total);
      try{Object.assign(shot,await analyzeShotCore(item,shot,settings,provider),{analysisStatus:'success',analysisError:'',analyzedAt:Date.now()});success++;}
      catch(error){shot.analysisStatus='failed';shot.analysisError=safeText(error.message,500);failed++;await appendAnalysisLog(item,{level:'error',shot:shot.index,message:shot.analysisError});}
      completed++;item.analysisSummary={total,completed,success,failed,updatedAt:Date.now()};item.storyboard=storyboardMarkdown(item);await saveProject(item);
      sendProgress(`AI 识别中 ${completed}/${total} · 成功 ${success} · 失败 ${failed}`,completed/total);
    }
  }
  try{await Promise.all(Array.from({length:Math.min(concurrency,total)},()=>worker()));}
  finally{
    const cancelled=analysisController.cancelled;
    item.status=cancelled?'segmented':failed?'analyzed_with_errors':'analyzed';
    item.analysisSummary={total,completed,success,failed,cancelled,updatedAt:Date.now()};item.storyboard=storyboardMarkdown(item);await saveProject(item);analysisController=null;
    sendProgress(cancelled?'已取消批量识别':`识别完成：成功 ${success}，失败 ${failed}`,1);
  }
  return {item,summary:item.analysisSummary};
}

async function testProviders(payload){
  const stored=await loadSettings(true),incoming=mergeSettings(payload?.settings||{});
  const candidates=Object.entries(incoming.providers).map(([id,provider])=>{
    const saved=stored.providers[id]||{};
    return [id,{...saved,...provider,apiKey:provider.apiKey||saved.apiKey,apiKeyError:saved.apiKeyError&&!provider.apiKey}];
  }).filter(([,provider])=>provider.apiKey&&provider.baseUrl&&provider.model);
  if(!candidates.length)throw new Error('没有可测试的完整 API 配置，请先填写地址、模型和 API Key');
  const results=await Promise.all(candidates.map(async([id,provider])=>{
    const startedAt=Date.now();
    try{
      const message=await callModel(provider,[{role:'user',content:'这是 FeiGe API 连接测试。请只回复 OK。'}],null,{attempts:1,maxTokens:32,temperature:0,timeoutMs:30000});
      return {id,label:provider.label||id,model:provider.model,ok:true,durationMs:Date.now()-startedAt,message:safeText(message,80)};
    }catch(error){
      return {id,label:provider.label||id,model:provider.model,ok:false,durationMs:Date.now()-startedAt,error:safeText(error.message,360)};
    }
  }));
  return {ok:results.every(result=>result.ok),connected:results.filter(result=>result.ok).length,total:results.length,results};
}

const RESEARCH_STAGE_PROGRESS={prepare:.04,split:.2,collage:.68,refine:.82};

async function setResearchStage(item,stage,status,detail=''){
  const workflow=item.researchWorkflow||{current:null,status:'idle',stages:{}};
  workflow.current=stage;
  workflow.status=status==='failed'?'failed':status==='done'&&stage==='refine'?'done':'running';
  workflow.stages={...workflow.stages,[stage]:{status,detail:safeText(detail,240),updatedAt:Date.now()}};
  item.researchWorkflow=workflow;
  await saveProject(item);
  sendProgress(detail||stage,RESEARCH_STAGE_PROGRESS[stage]??null,{stage,researchWorkflow:workflow});
}

function evenlySelectedShots(shots,limit=12){
  if(shots.length<=limit)return shots;
  const selected=[];
  for(let index=0;index<limit;index++)selected.push(shots[Math.round(index*(shots.length-1)/(limit-1))]);
  return selected;
}

async function buildResearchCollage(item){
  const shots=evenlySelectedShots(item.shots||[],12);
  if(!shots.length)throw new Error('没有可用于拼图的分镜');
  const frameDir=path.join(projectDir(item),'frames'),output=path.join(projectDir(item),'research-collage.jpg');
  const inputs=[];
  for(const shot of shots)inputs.push('-i',path.join(frameDir,shot.frame));
  if(shots.length===1){
    await run(toolPath('ffmpeg'),['-y',...inputs,'-vf','scale=320:180:force_original_aspect_ratio=decrease,pad=320:180:(ow-iw)/2:(oh-ih)/2:color=0x0b0d10','-frames:v','1','-q:v','3',output]);
  }else{
    const cols=Math.min(4,shots.length),cellW=320,cellH=180;
    const normalized=shots.map((_,index)=>`[${index}:v]scale=${cellW}:${cellH}:force_original_aspect_ratio=decrease,pad=${cellW}:${cellH}:(ow-iw)/2:(oh-ih)/2:color=0x0b0d10[v${index}]`).join(';');
    const streams=shots.map((_,index)=>`[v${index}]`).join('');
    const layout=shots.map((_,index)=>`${(index%cols)*cellW}_${Math.floor(index/cols)*cellH}`).join('|');
    await run(toolPath('ffmpeg'),['-y',...inputs,'-filter_complex',`${normalized};${streams}xstack=inputs=${shots.length}:layout=${layout}:fill=0x0b0d10[out]`,'-map','[out]','-frames:v','1','-q:v','3',output]);
  }
  item.research={...(item.research||{}),collageFile:path.basename(output),collageShotIds:shots.map(shot=>shot.id),collageUpdatedAt:Date.now()};
  await saveProject(item);
  return output;
}

async function refineResearchReport(item){
  const settings=await loadSettings(true),provider=settings.providers[settings.activeProvider];
  const collageFile=item.research?.collageFile&&path.join(projectDir(item),item.research.collageFile);
  if(!collageFile||!fs.existsSync(collageFile))throw new Error('风格拼图不存在，请重新运行风格研究');
  const digest=(item.shots||[]).map(shot=>`镜${shot.index} ${shot.startTc}-${shot.endTc} ${[shot.shotSize,shot.angle,shot.movement,shot.description].filter(Boolean).join(' · ')}`).join('\n');
  const prompt=`你是影视视觉风格研究员。请结合镜头拼图与按时间排序的分镜信息，提炼可复用、可执行的视觉语言。输出中文 Markdown，严格使用以下结构：\n# 风格研究\n## 一句话视觉定位\n## 色彩与光线\n## 构图与景别\n## 镜头运动与剪辑节奏\n## 场景、美术与人物呈现\n## 可复用拍摄规则\n## 避免事项\n不得编造画面中不存在的事实。\n\n分镜摘要：\n${digest}`;
  const media={images:[{dataUrl:dataUrl('image/jpeg',await fsp.readFile(collageFile)),label:'按时间顺序选取的代表镜头拼图'}]};
  const report=stripCodeFence(await callModel(provider,[{role:'user',content:prompt}],media,{maxTokens:4096,temperature:.2}));
  item.script=/^#\s*风格研究/m.test(report)?report:`# 风格研究\n\n${report}`;
  const stamp=Date.now(),version={id:stamp,createdAt:stamp,providerId:settings.activeProvider,providerLabel:provider.label||settings.activeProvider,model:provider.model||'',mediaMode:'research-collage'};
  item.scriptScenes=splitScriptScenes(item.script);
  item.activeScriptVersionId=stamp;
  item.scriptVersions=[version,...(item.scriptVersions||[])].slice(0,50);
  item.research={...(item.research||{}),reportFile:'style-research.md',completedAt:stamp};
  await saveProject(item);
  await fsp.writeFile(path.join(projectDir(item),'style-research.md'),item.script,'utf8');
  await writeJson(path.join(projectDir(item),'versions.json'),item.scriptVersions);
  return item;
}

async function runStyleResearch(item){
  if(item.kind!=='research')throw new Error('当前项目不是风格研究');
  let currentStage='prepare';
  try{
    item.status='researching';
    item.researchWorkflow={current:'prepare',status:'running',stages:{}};
    await setResearchStage(item,'prepare','running','正在读取视频与研究参数…');
    const info=await videoInfo(item.videoPath);
    item.videoMeta=info;item.duration=info.duration;
    await setResearchStage(item,'prepare','done','准备完成');

    currentStage='split';await setResearchStage(item,'split','running','正在进行分镜拆解…');
    item=await detectScenes(item,{progressStage:'split'});
    await setResearchStage(item,'split','done',`已拆解 ${item.shots.length} 个镜头`);

    currentStage='collage';await setResearchStage(item,'collage','running','正在构建代表镜头拼图…');
    await buildResearchCollage(item);
    await setResearchStage(item,'collage','done','镜头拼图已生成');

    currentStage='refine';await setResearchStage(item,'refine','running','正在调用 AI 提炼视觉风格…');
    item=await refineResearchReport(item);
    item.status='research_complete';
    await setResearchStage(item,'refine','done','风格研究已完成');
    sendProgress('风格研究已完成',1,{stage:'refine',researchWorkflow:item.researchWorkflow});
    return item;
  }catch(error){
    item.status='research_failed';
    await setResearchStage(item,currentStage,'failed',safeText(error.message,240)).catch(()=>{});
    sendProgress(`风格研究失败：${safeText(error.message,240)}`,1,{stage:currentStage,researchWorkflow:item.researchWorkflow});
    throw error;
  }
}

async function refineStyleResearch(item){
  if(item.kind!=='research')throw new Error('当前项目不是风格研究');
  if(!item.shots?.length||!item.research?.collageFile)return runStyleResearch(item);
  try{
    await setResearchStage(item,'refine','running','正在重新调用 AI 提炼视觉风格…');
    item=await refineResearchReport(item);item.status='research_complete';
    await setResearchStage(item,'refine','done','风格报告新版本已保存');
    sendProgress('风格报告新版本已保存',1,{stage:'refine',researchWorkflow:item.researchWorkflow});
    return item;
  }catch(error){await setResearchStage(item,'refine','failed',safeText(error.message,240)).catch(()=>{});throw error;}
}

async function generateScript(item){
  const settings=await loadSettings(true),provider=settings.providers[settings.activeProvider];
  const digest=(item.shots||[]).map(s=>`镜${s.index} ${s.startTc}-${s.endTc}\n场景:${[s.scene,s.timeOfDay,s.interiorExterior].filter(Boolean).join(' ')}\n景别/角度/运镜:${s.shotSize}/${s.angle}/${s.movement}\n画面:${s.description||''}\n台词或字幕:${s.dialogue||''}\n声音:${s.sound||''}`).join('\n\n');
  sendProgress('正在准备剧本分析素材…',.12);
  const media=await makeScriptMedia(item,provider);
  const mediaHint=media.mode==='video'
    ? '已附上带声音的视频，请结合视频内容、时间顺序与下方分镜生成剧本。'
    : `已附上 ${media.images.length} 张按固定间隔均匀抽取并标有时间戳的关键帧，请严格结合图片顺序与时间戳。`;
  const prompt=`${settings.scriptPrompt}\n\n${mediaHint}\n源视频:${path.basename(item.videoPath||'')}\n时长:${timecode(item.duration)}\n\n完整分镜：\n${digest}`;
  sendProgress('正在调用模型生成剧本…',.42);
  try {
    item.script=stripCodeFence(await callModel(provider,[{role:'user',content:prompt}],media,{maxTokens:8192,temperature:.2}));
  } catch (mediaError) {
    if (!media.images?.length) throw mediaError;
    await appendAnalysisLog(item,{level:'warning',message:`当前模型未接受多图剧本输入，已改用带时间戳的完整分镜文字：${safeText(mediaError.message,240)}`});
    item.script=stripCodeFence(await callModel(provider,[{role:'user',content:`${settings.scriptPrompt}\n\n当前模型不接受图片，请严格依据以下带时间戳的完整分镜生成剧本。\n源视频:${path.basename(item.videoPath||'')}\n时长:${timecode(item.duration)}\n\n${digest}`}],null,{maxTokens:8192,temperature:.2}));
  }
  if(!/^#\s*剧本/m.test(item.script))item.script=`# 剧本\n\n源视频: ${path.basename(item.videoPath||'未知视频')}\n时长: ${timecode(item.duration)}\n\n${item.script}`;
  const stamp=Date.now(),version={id:stamp,createdAt:stamp,providerId:settings.activeProvider,providerLabel:provider.label||settings.activeProvider,model:provider.model||'',mediaMode:media.mode};
  item.scriptScenes=splitScriptScenes(item.script);
  item.activeScriptVersionId=stamp;
  item.scriptVersions=[version,...(item.scriptVersions||[])].slice(0,50);
  await saveProject(item);
  await writeJson(path.join(projectDir(item),'versions.json'),item.scriptVersions);
  sendProgress('剧本新版本已保存',1);
  return item;
}

async function saveScriptScenes(item, scenes) {
  item.scriptScenes = (Array.isArray(scenes) ? scenes : []).map(scene => String(scene || '').trim()).filter(Boolean);
  item.script = joinScriptScenes(item.scriptScenes);
  if (!item.activeScriptVersionId) {
    const stamp=Date.now();
    item.activeScriptVersionId=stamp;
    item.scriptVersions=[{id:stamp,createdAt:stamp,providerId:'manual',providerLabel:'手动编辑 / Manual edit',model:'',mediaMode:'manual'},...(item.scriptVersions||[])].slice(0,50);
  }
  await saveProject(item);
  await writeJson(path.join(projectDir(item),'versions.json'),item.scriptVersions||[]);
  return item;
}

async function activateScriptVersion(item, versionId) {
  const version = (item.scriptVersions || []).find(entry => String(entry.id) === String(versionId));
  if (!version) throw new Error('剧本版本不存在');
  item.script = await fsp.readFile(scriptVersionPath(item, version.id), 'utf8');
  item.scriptScenes = splitScriptScenes(item.script);
  item.activeScriptVersionId = version.id;
  await saveProject(item);
  return item;
}

async function deleteScriptVersion(item, versionId) {
  const versions = item.scriptVersions || [];
  const target = versions.find(entry => String(entry.id) === String(versionId));
  if (!target) return item;
  item.scriptVersions = versions.filter(entry => String(entry.id) !== String(versionId));
  await fsp.rm(scriptVersionPath(item, target.id), { force:true });
  if (String(item.activeScriptVersionId) === String(target.id)) {
    const next = item.scriptVersions[0];
    if (next) {
      item.script = await fsp.readFile(scriptVersionPath(item, next.id), 'utf8');
      item.scriptScenes = splitScriptScenes(item.script);
      item.activeScriptVersionId = next.id;
    } else {
      item.script = '';
      item.scriptScenes = [];
      item.activeScriptVersionId = null;
    }
  }
  await saveProject(item);
  await writeJson(path.join(projectDir(item),'versions.json'),item.scriptVersions);
  return item;
}

async function updateShot(item, shotId, changes) {
  const shot = (item.shots || []).find(entry => entry.id === shotId);
  if (!shot) throw new Error('镜头不存在');
  if (shot.analysisStatus === 'running') throw new Error('镜头正在识别，暂时不能编辑');
  const fields = ['scene','timeOfDay','interiorExterior','shotSize','angle','movement','description','dialogue','sound'];
  for (const field of fields) if (Object.hasOwn(changes || {}, field)) shot[field] = safeText(changes[field], field === 'description' ? 4000 : 2000);
  shot.editedAt = Date.now();
  item.storyboard = storyboardMarkdown(item);
  await saveProject(item);
  return item;
}

async function deleteShot(item, shotId) {
  const index = (item.shots || []).findIndex(entry => entry.id === shotId);
  if (index < 0) return item;
  const shot = item.shots[index];
  if (shot.analysisStatus === 'running') throw new Error('镜头正在识别，暂时不能删除');
  item.shots.splice(index,1);
  if (item.shots.length) {
    if (index === 0) item.shots[0].start = shot.start;
    else item.shots[index - 1].end = shot.end;
  }
  item.shots.forEach((entry, order) => {
    entry.index = order + 1;
    entry.startTc = timecode(entry.start);
    entry.endTc = timecode(entry.end);
  });
  item.analysisSummary = null;
  item.storyboard = storyboardMarkdown(item);
  await saveProject(item);
  return item;
}

function safeFileName(value){return String(value||'FeiGe').replace(/[<>:"/\\|?*\x00-\x1f]/g,'_').replace(/[. ]+$/g,'').trim()||'FeiGe';}

async function prepareExportItem(item){
  try{item.videoMeta={...(item.videoMeta||{}),...(await videoInfo(item.videoPath))};await saveProject(item);}
  catch(error){await appendAnalysisLog(item,{level:'warning',message:`读取导出元数据失败：${safeText(error.message,240)}`});}
  return item;
}

function zipDirectory(sourceDir,outputFile){
  return new Promise((resolve,reject)=>{
    const output=fs.createWriteStream(outputFile),archive=archiver('zip',{zlib:{level:9}});
    output.on('close',()=>resolve(outputFile));
    output.on('error',reject);
    archive.on('warning',error=>{if(error.code!=='ENOENT')reject(error);});
    archive.on('error',reject);
    archive.pipe(output);
    archive.directory(sourceDir,false);
    archive.finalize();
  });
}

async function runUiSmoke(runtimeMessages) {
  const outputDir=path.join(process.cwd(),'outputs');await fsp.mkdir(outputDir,{recursive:true});
  const captures=[],viewports=[];
  const capture=async name=>{const image=await win.webContents.capturePage();const file=path.join(outputDir,`${name}.png`);await fsp.writeFile(file,image.toPNG());captures.push(file);};
  await sleep(900);
  await win.webContents.executeJavaScript(`document.querySelector('.nav-item')?.click()`);await sleep(900);
  const contextMenuItems=await win.webContents.executeJavaScript(`(()=>{const card=document.querySelector('.shot-card');card?.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,clientX:520,clientY:360}));return document.querySelectorAll('#contextMenu:not(.hidden) [role="menuitem"]').length})()`);
  await win.webContents.executeJavaScript(`document.body.click()`);
  for(const [width,height] of [[1060,680],[1366,768],[1440,900],[1920,1080],[2560,1080]]){
    win.setSize(width,height);await sleep(180);
    const layout=await win.webContents.executeJavaScript(`({width:innerWidth,height:innerHeight,bodyOverflow:document.documentElement.scrollWidth>document.documentElement.clientWidth,workGrid:getComputedStyle(document.querySelector('.work-grid')).gridTemplateColumns,shots:document.querySelectorAll('.shot-card').length})`);
    viewports.push({requested:{width,height},...layout});await capture(`ui-shots-${width}x${height}`);
  }
  win.setSize(1440,900);await sleep(180);
  await win.webContents.executeJavaScript(`document.querySelector('[data-shot-edit]')?.click()`);await sleep(100);await capture('ui-shot-editor');
  await win.webContents.executeJavaScript(`document.querySelector('#editDescription').value='界面自动测试：镜头编辑已保存';document.querySelector('#saveShotEdit').click()`);await sleep(450);
  const shotEdited=await win.webContents.executeJavaScript(`document.querySelector('.shot-desc')?.textContent.includes('镜头编辑已保存')`);
  await win.webContents.executeJavaScript(`document.querySelector('#scriptTab').click()`);await sleep(180);await capture('ui-script-versions');
  await win.webContents.executeJavaScript(`document.querySelector('[data-script-edit]')?.click()`);await sleep(100);await capture('ui-scene-editor');
  await win.webContents.executeJavaScript(`document.querySelector('#editSceneSource').value+='\\n△界面自动测试修改。';document.querySelector('#saveSceneEdit').click()`);await sleep(420);
  const sceneEdited=await win.webContents.executeJavaScript(`document.querySelector('.script-scene pre')?.textContent.includes('界面自动测试修改')`);
  await win.webContents.executeJavaScript(`const select=document.querySelector('#scriptVersion');select.value='smoke-v1';select.dispatchEvent(new Event('change',{bubbles:true}))`);await sleep(420);
  const versionSwitched=await win.webContents.executeJavaScript(`document.querySelector('#scriptEditor').value.includes('旧版本台词')`);
  await win.webContents.executeJavaScript(`window.confirm=()=>true;document.querySelector('#deleteScriptVersion').click()`);
  let versionDeleted=false;
  for(let attempt=0;attempt<30;attempt++){
    versionDeleted=await win.webContents.executeJavaScript(`document.querySelectorAll('#scriptVersion option').length===1`);
    if(versionDeleted)break;
    await sleep(100);
  }
  await win.webContents.executeJavaScript(`document.querySelector('#settingsBtn').click()`);
  for(let attempt=0;attempt<20;attempt++){if(await win.webContents.executeJavaScript(`document.querySelector('#settingsDialog')?.open`))break;await sleep(100);}
  await sleep(500);
  await win.webContents.executeJavaScript(`(()=>{const dialog=document.querySelector('#settingsDialog');if(dialog&&!dialog.open)dialog.showModal();return !!dialog?.open})()`);
  await sleep(200);
  const settingsState=await win.webContents.executeJavaScript(`({open:document.querySelector('#settingsDialog')?.open,hybrid:document.querySelector('input[name="detectionMode"][value="hybrid"]')?.checked,maxShots:document.querySelector('#setMaxShots')?.value,hardCutFloor:document.querySelector('#setHardCutFloor')?.value,globalTestButtons:document.querySelectorAll('#testAllProviders').length,legacyTestButtons:document.querySelectorAll('#testProvider').length})`);
  await capture('ui-settings');
  await win.webContents.executeJavaScript(`document.querySelector('#settingsDialog').close()`);
  await win.webContents.executeJavaScript(`document.querySelector('.nav-row[data-project-kind="project"] .nav-more')?.click()`);await sleep(120);
  const projectMenuItems=await win.webContents.executeJavaScript(`document.querySelectorAll('#contextMenu:not(.hidden) [role="menuitem"]').length`);
  await capture('ui-project-menu');
  await win.webContents.executeJavaScript(`document.querySelector('#contextMenu [data-menu-action="rename-project"]')?.click()`);await sleep(120);
  const renameDialogOpen=await win.webContents.executeJavaScript(`Boolean(document.querySelector('#renameProjectDialog')?.open)`);
  await win.webContents.executeJavaScript(`document.querySelector('#renameProjectDialog')?.close()`);
  await sleep(250);
  await win.webContents.executeJavaScript(`document.querySelector('.nav-row[data-project-kind="research"] .nav-item')?.click()`);await sleep(1200);
  await win.webContents.executeJavaScript(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))`);
  const researchState=await win.webContents.executeJavaScript(`({visible:!document.querySelector('#researchWorkflow')?.classList.contains('hidden'),steps:document.querySelectorAll('#researchWorkflow [data-research-stage]').length,done:document.querySelectorAll('#researchWorkflow [data-research-stage].done').length,menuButtons:document.querySelectorAll('.nav-more').length})`);
  await capture('ui-research-workflow');
  const state=await win.webContents.executeJavaScript(`({title:document.title,hasBridge:!!window.feige,dialogs:document.querySelectorAll('dialog').length,buttons:document.querySelectorAll('button').length,errorText:document.querySelector('#toast')?.textContent||''})`);
  const checks={contextMenuItems,projectMenuItems,renameDialogOpen,researchState,shotEdited,sceneEdited,versionSwitched,versionDeleted,settingsState,noHorizontalOverflow:viewports.every(view=>!view.bodyOverflow)};
  const ok=state.hasBridge&&!runtimeMessages.length&&contextMenuItems===3&&projectMenuItems===3&&renameDialogOpen&&researchState.visible&&researchState.steps===4&&researchState.done===4&&researchState.menuButtons>=2&&shotEdited&&sceneEdited&&versionSwitched&&versionDeleted&&settingsState.open&&settingsState.hybrid&&settingsState.globalTestButtons===1&&settingsState.legacyTestButtons===0&&String(settingsState.maxShots)==='6000'&&checks.noHorizontalOverflow;
  await writeJson(path.join(outputDir,'ui-smoke.json'),{ok,checkedAt:Date.now(),state,checks,viewports,captures,runtimeMessages});
  await fsp.rm(path.join(projectsRoot(),UI_SMOKE_PROJECT_ID),{recursive:true,force:true});
  await fsp.rm(path.join(researchRoot(),'ui-smoke-research'),{recursive:true,force:true});
}

function createWindow() {
  const uiSmoke = process.argv.includes('--ui-smoke-test');
  const runtimeMessages = [];
  Menu.setApplicationMenu(null);
  win = new BrowserWindow({ width:1440,height:900,minWidth:1060,minHeight:680,show:!uiSmoke,backgroundColor:'#0b0d10',title:'FeiGe',autoHideMenuBar:true,webPreferences:{preload:path.join(__dirname,'preload.js'),contextIsolation:true,nodeIntegration:false} });
  win.setMenuBarVisibility(false);
  win.webContents.on('console-message',(_,details)=>{if(details.level>=2)runtimeMessages.push({level:details.level,message:safeText(details.message,500),line:details.lineNumber,sourceId:path.basename(details.sourceId||'')});});
  win.webContents.on('did-finish-load', async () => {
    try {
      const summary = await win.webContents.executeJavaScript(`({title:document.title,text:document.body.innerText.slice(0,3000),hasBridge:!!window.feige})`);
      await writeJson(path.join(app.getPath('userData'), 'startup-check.json'), { ok:true, checkedAt:Date.now(), ...summary });
      if(uiSmoke){
        await runUiSmoke(runtimeMessages);
        app.quit();
      }
    } catch (error) {
      await writeJson(path.join(app.getPath('userData'), 'startup-check.json'), { ok:false, checkedAt:Date.now(), error:error.message });
      if(uiSmoke){await writeJson(path.join(process.cwd(),'outputs','ui-smoke.json'),{ok:false,checkedAt:Date.now(),error:safeText(error.message,500),runtimeMessages});app.quit();}
    }
  });
  win.webContents.on('render-process-gone', async (_, details) => writeJson(path.join(app.getPath('userData'), 'renderer-error.json'), details));
  win.loadFile(path.join(__dirname,'index.html'));
}

async function runPackagedSmokeTest(){
  const reportFile=path.join(app.getPath('userData'),'packaged-smoke-test.json');
  try{
    const lists=[...(await listKind(projectsRoot())),...(await listKind(researchRoot()))];
    const item=lists.find(project=>project.shots?.length);
    if(!item)throw new Error('没有可用于测试的已拆镜项目');
    const shot=item.shots.find(candidate=>!candidate.description||candidate.analysisStatus==='failed')||item.shots[0];
    await analyzeShot(item,shot.id);
    await writeJson(reportFile,{ok:Boolean(shot.description),checkedAt:Date.now(),project:item.name,shot:shot.index,status:shot.analysisStatus,hasDescription:Boolean(shot.description),hasSound:Boolean(shot.sound)});
  }catch(error){await writeJson(reportFile,{ok:false,checkedAt:Date.now(),error:safeText(error.message,500)});}
}

async function runMediaSmokeTest(videoPath){
  const outputDir=path.join(process.cwd(),'outputs'),reportFile=path.join(outputDir,'media-smoke.json');await fsp.mkdir(outputDir,{recursive:true});
  const item={id:'media-smoke-fixture',kind:'project',name:'media-smoke',videoPath,createdAt:Date.now(),updatedAt:Date.now(),shots:[],script:'',storyboard:''};
  try{
    const info=await videoInfo(videoPath);item.duration=info.duration;await fsp.mkdir(projectDir(item),{recursive:true});
    const images=await makeUniformScriptFrames(item,24),video=await makeGeminiScriptVideo(item),overview=path.join(projectDir(item),'script-media','overview.mp4');
    const overviewSize=await fsp.stat(overview).then(stat=>stat.size).catch(()=>0);
    await writeJson(reportFile,{ok:images.length>0&&Boolean(video),checkedAt:Date.now(),source:path.basename(videoPath),duration:info.duration,frames:images.length,firstLabel:images[0]?.label,lastLabel:images.at(-1)?.label,overviewSize,videoDataBytes:video?Buffer.byteLength(video):0});
  }catch(error){await writeJson(reportFile,{ok:false,checkedAt:Date.now(),error:safeText(error.message,500)});}
  finally{await fsp.rm(projectDir(item),{recursive:true,force:true});}
}

async function runDetectionSmokeTest(videoPath){
  const outputDir=path.join(process.cwd(),'outputs'),reportFile=path.join(outputDir,'detection-smoke.json');await fsp.mkdir(outputDir,{recursive:true});
  const item={id:'detection-smoke-fixture',kind:'project',name:'detection-smoke',videoPath,createdAt:Date.now(),updatedAt:Date.now(),shots:[],script:'',storyboard:''};
  try{
    await fsp.mkdir(path.join(projectDir(item),'frames'),{recursive:true});
    const result=await detectScenes(item,{mode:'hybrid',hardCutFloor:5.5,relativeMultiplier:8,classicThreshold:.08,minGap:.5,maxShots:6000});
    const frameDir=path.join(projectDir(item),'frames'),frames=await fsp.readdir(frameDir),frameStats=await Promise.all(frames.map(file=>fsp.stat(path.join(frameDir,file))));
    await writeJson(reportFile,{ok:result.shots.length>1&&frames.length===result.shots.length&&frameStats.every(stat=>stat.size>0),checkedAt:Date.now(),source:path.basename(videoPath),duration:result.duration,shots:result.shots.length,frames:frames.length,detectorCounts:result.detection?.detectorCounts,mode:result.detection?.mode,firstRange:result.shots[0]?[result.shots[0].startTc,result.shots[0].endTc]:null,lastRange:result.shots.at(-1)?[result.shots.at(-1).startTc,result.shots.at(-1).endTc]:null});
  }catch(error){await writeJson(reportFile,{ok:false,checkedAt:Date.now(),error:safeText(error.message,500)});}
  finally{await fsp.rm(projectDir(item),{recursive:true,force:true});}
}

async function runResearchMediaSmokeTest(videoPath){
  const outputDir=path.join(process.cwd(),'outputs'),reportFile=path.join(outputDir,'research-media-smoke.json');await fsp.mkdir(outputDir,{recursive:true});
  const item={id:'research-media-smoke',kind:'research',name:'research-media-smoke',videoPath,createdAt:Date.now(),updatedAt:Date.now(),shots:[],script:'',storyboard:''};
  try{
    await fsp.mkdir(path.join(projectDir(item),'frames'),{recursive:true});
    await detectScenes(item,{mode:'hybrid',hardCutFloor:5.5,relativeMultiplier:8,classicThreshold:.08,minGap:.5,maxShots:6000,progressStage:'split'});
    const collage=await buildResearchCollage(item),smokeCollage=path.join(outputDir,'research-collage-smoke.jpg');
    await fsp.copyFile(collage,smokeCollage);
    const stat=await fsp.stat(smokeCollage),info=await videoInfo(smokeCollage);
    await writeJson(reportFile,{ok:item.shots.length>1&&stat.size>0&&info.width>=320&&info.height>=180,checkedAt:Date.now(),source:path.basename(videoPath),shots:item.shots.length,collage:path.basename(smokeCollage),collageBytes:stat.size,width:info.width,height:info.height,selectedFrames:item.research?.collageShotIds?.length||0});
  }catch(error){await writeJson(reportFile,{ok:false,checkedAt:Date.now(),error:safeText(error.message,500)});}
  finally{await fsp.rm(projectDir(item),{recursive:true,force:true});}
}

async function runProjectCrudSmokeTest(){
  const outputDir=path.join(process.cwd(),'outputs'),reportFile=path.join(outputDir,'project-crud-smoke.json');await fsp.mkdir(outputDir,{recursive:true});
  let item;
  try{
    item=await createProject('research',path.join(process.cwd(),'gemini-smoke-frame.jpg'),'crud-smoke-before');
    const originalDir=projectDir(item),renamed=await renameProject({kind:item.kind,id:item.id,name:'crud-smoke-after'});
    const loaded=await projectByIdentity({kind:item.kind,id:item.id});
    await deleteProjectByIdentity({kind:item.kind,id:item.id});
    const removed=!fs.existsSync(originalDir);
    await writeJson(reportFile,{ok:renamed.name==='crud-smoke-after'&&loaded.name==='crud-smoke-after'&&removed,checkedAt:Date.now(),renamed:renamed.name,removed});
  }catch(error){
    await writeJson(reportFile,{ok:false,checkedAt:Date.now(),error:safeText(error.message,500)});
    if(item)await fsp.rm(projectDir(item),{recursive:true,force:true});
  }
}

async function runAiConfigSmokeTest(configPath){
  const outputDir=path.join(process.cwd(),'outputs'),reportFile=path.join(outputDir,'ai-smoke.json');await fsp.mkdir(outputDir,{recursive:true});
  try{
    const yaml=await fsp.readFile(configPath,'utf8'),section=yaml.match(/gemini:\s*\n([\s\S]*?)(?=\n\S|$)/)?.[1]||'';
    const key=section.match(/api_key:\s*['"]?([^'"\r\n]+)['"]?/)?.[1]?.trim(),model=section.match(/model:\s*['"]?([^'"\r\n]+)['"]?/)?.[1]?.trim()||'gemini-3.1-flash-lite';
    if(!key)throw new Error('Gemini 配置中没有 API Key');
    const imagePath=path.join(process.cwd(),'gemini-smoke-frame.jpg'),media={images:[{dataUrl:dataUrl('image/jpeg',await fsp.readFile(imagePath)),label:'接口测试关键帧'}]};
    const provider={label:'Gemini',type:'gemini',baseUrl:'https://generativelanguage.googleapis.com/v1beta',model,apiKey:key};
    const text=await callModel(provider,[{role:'user',content:'请只返回 JSON：{"ok":true,"description":"用中文简短描述图片"}'}],media,{attempts:2,maxTokens:256,timeoutMs:90000});
    await writeJson(reportFile,{ok:Boolean(text),checkedAt:Date.now(),provider:'Gemini',model,response:safeText(text,500)});
  }catch(error){await writeJson(reportFile,{ok:false,checkedAt:Date.now(),error:safeText(error.message,500)});}
}

app.whenReady().then(async()=>{
  uiLocale=normalizeUiLocale(app.getLocale());
  await initializeWorkspace();
  if(process.argv.includes('--ui-smoke-test'))await createUiSmokeFixture();
  if(process.argv.includes('--smoke-test-ai')){await runPackagedSmokeTest();app.quit();return;}
  const mediaSmokeArg=process.argv.find(argument=>argument.startsWith('--media-smoke-test='));
  if(mediaSmokeArg){await runMediaSmokeTest(mediaSmokeArg.slice('--media-smoke-test='.length));app.quit();return;}
  const detectionSmokeArg=process.argv.find(argument=>argument.startsWith('--detection-smoke-test='));
  if(detectionSmokeArg){await runDetectionSmokeTest(detectionSmokeArg.slice('--detection-smoke-test='.length));app.quit();return;}
  const researchMediaSmokeArg=process.argv.find(argument=>argument.startsWith('--research-media-smoke-test='));
  if(researchMediaSmokeArg){await runResearchMediaSmokeTest(researchMediaSmokeArg.slice('--research-media-smoke-test='.length));app.quit();return;}
  if(process.argv.includes('--project-crud-smoke-test')){await runProjectCrudSmokeTest();app.quit();return;}
  const aiSmokeArg=process.argv.find(argument=>argument.startsWith('--ai-config-smoke-test='));
  if(aiSmokeArg){await runAiConfigSmokeTest(aiSmokeArg.slice('--ai-config-smoke-test='.length));app.quit();return;}
  createWindow();
});
app.on('window-all-closed',()=>{ if(process.platform!=='darwin') app.quit(); });
app.on('activate',()=>{ if(BrowserWindow.getAllWindows().length===0) createWindow(); });

ipcMain.handle('set-ui-language',(_,locale)=>{uiLocale=normalizeUiLocale(locale);return uiLocale;});
ipcMain.handle('choose-video',async()=>{ const r=await dialog.showOpenDialog(win,{title:nativeDialogText('chooseVideoTitle'),properties:['openFile'],filters:[{name:nativeDialogText('videoFiles'),extensions:['mp4','mov','mkv','avi','webm','m4v','ts']}]}); return r.canceled?null:r.filePaths[0]; });
ipcMain.handle('list-all',async()=>({projects:await listKind(projectsRoot()),research:await listKind(researchRoot())}));
ipcMain.handle('create-project',async(_,payload)=>createProject(payload.kind,payload.videoPath,payload.name));
ipcMain.handle('load-project',async(_,payload)=>projectByIdentity(payload));
ipcMain.handle('save-project',async(_,item)=>saveProject(item));
ipcMain.handle('rename-project',async(_,payload)=>renameProject(payload));
ipcMain.handle('delete-project',async(_,payload)=>deleteProjectByIdentity(payload));
ipcMain.handle('detect-scenes',async(_,payload)=>detectScenes(payload.item,payload.options));
ipcMain.handle('run-style-research',async(_,item)=>runStyleResearch(item));
ipcMain.handle('refine-style-research',async(_,item)=>refineStyleResearch(item));
ipcMain.handle('analyze-shot',async(_,payload)=>analyzeShot(payload.item,payload.shotId));
ipcMain.handle('analyze-all-shots',async(_,payload)=>analyzeAllShots(payload.item,payload.mode||'all'));
ipcMain.handle('cancel-analysis',async()=>{if(analysisController)analysisController.cancelled=true;return true;});
ipcMain.handle('generate-script',async(_,item)=>generateScript(item));
ipcMain.handle('save-script-scenes',async(_,payload)=>saveScriptScenes(payload.item,payload.scenes));
ipcMain.handle('activate-script-version',async(_,payload)=>activateScriptVersion(payload.item,payload.versionId));
ipcMain.handle('delete-script-version',async(_,payload)=>deleteScriptVersion(payload.item,payload.versionId));
ipcMain.handle('update-shot',async(_,payload)=>updateShot(payload.item,payload.shotId,payload.changes));
ipcMain.handle('delete-shot',async(_,payload)=>deleteShot(payload.item,payload.shotId));
ipcMain.handle('get-settings',async()=>loadSettings(false));
ipcMain.handle('test-providers',async(_,payload)=>testProviders(payload));
ipcMain.handle('save-settings',async(_,settings)=>{ const current=await loadSettings(true); const merged=mergeSettings(settings); for(const [id,p] of Object.entries(merged.providers)){ const key=p.apiKey||current.providers[id]?.apiKey||''; p.apiKey=encrypt(key); delete p.hasApiKey; delete p.apiKeyError; } await writeJson(settingsFile(),merged); return true; });
ipcMain.handle('export-file',async(_,payload)=>{
  let item=await prepareExportItem(payload.item);
  if(payload.type==='script'&&!String(item.script||'').trim()){sendProgress('正在先生成专业剧本…',.08);item=await generateScript(item);}
  const name=safeFileName(item.name),options={projectDir:projectDir(item),frameDir:path.join(projectDir(item),'frames')};
  const formats={
    script:{extension:'docx',label:'Word 文档',dialogTitle:nativeDialogText('saveScriptTitle'),dialogLabel:nativeDialogText('wordDocument'),defaultPath:`${name}-剧本.docx`,write:exportScriptDocx},
    storyboard:{extension:'xlsx',label:'Excel 工作簿',dialogTitle:nativeDialogText('saveStoryboardTitle'),dialogLabel:nativeDialogText('excelWorkbook'),defaultPath:`${name}-分镜表.xlsx`,write:exportStoryboardXlsx},
    html:{extension:'html',label:'离线网页',dialogTitle:nativeDialogText('saveHtmlTitle'),dialogLabel:nativeDialogText('offlineWebpage'),defaultPath:`${name}.html`,write:exportHtml}
  };
  const format=formats[payload.type];if(!format)throw new Error('不支持的导出格式');
  const result=await dialog.showSaveDialog(win,{title:format.dialogTitle,defaultPath:format.defaultPath,filters:[{name:format.dialogLabel,extensions:[format.extension]}]});
  if(result.canceled)return false;
  sendProgress(`正在生成 ${format.label}…`,.3);await format.write(item,result.filePath,options);sendProgress('导出完成',1);return result.filePath;
});
ipcMain.handle('export-all',async(_,sourceItem)=>{
  let item=await prepareExportItem(sourceItem);
  if(!String(item.script||'').trim()){
    try{sendProgress('正在生成专业剧本…',.08);item=await generateScript(item);}
    catch(error){await appendAnalysisLog(item,{level:'warning',message:`自动生成剧本失败，继续导出分镜：${safeText(error.message,300)}`});}
  }
  const selected=await dialog.showOpenDialog(win,{title:nativeDialogText('chooseExportFolder'),properties:['openDirectory','createDirectory']});if(selected.canceled)return false;
  const parent=selected.filePaths[0],folderName=`${safeFileName(item.name)}-FeiGe拆片结果`,resultDir=path.join(parent,folderName),options={projectDir:projectDir(item),frameDir:path.join(projectDir(item),'frames')};
  sendProgress('正在生成 HTML、Excel 和 Word…',.35);const paths=await exportAll(item,resultDir,options);
  const zipPath=path.join(parent,`${folderName}.zip`);await fsp.rm(zipPath,{force:true});sendProgress('正在打包分享压缩包…',.85);await zipDirectory(resultDir,zipPath);sendProgress('三种成品与分享压缩包已生成',1);shell.showItemInFolder(zipPath);return {...paths,zip:zipPath,folder:resultDir};
});
ipcMain.handle('open-project-folder',async(_,item)=>shell.openPath(projectDir(item)));
ipcMain.handle('local-frame',async(_,payload)=>pathToFileURL(path.join(projectDir(payload.item),'frames',payload.frame)).href);
ipcMain.handle('add-manual-cut',async(_,payload)=>{
  const item=payload.item,t=Number(payload.time);
  const idx=item.shots.findIndex(s=>t>s.start+.05&&t<s.end-.05);
  if(idx<0)return item;
  const first=item.shots[idx];
  if(first.analysisStatus==='running')throw new Error('镜头正在识别，暂时不能增加切点');
  const secondFrame=`frame_manual_${crypto.randomUUID()}.jpg`;
  const second={...first,id:crypto.randomUUID(),frame:secondFrame,start:t,startTc:timecode(t),analysisStatus:'pending',analysisError:'',description:'',dialogue:'',sound:''};
  first.end=t;first.endTc=timecode(t);first.analysisStatus='pending';first.analysisError='';
  const frameDir=path.join(projectDir(item),'frames');
  await extractFrame(item.videoPath,Math.min(first.end-.05,first.start+Math.max(.1,(first.end-first.start)/2)),path.join(frameDir,first.frame));
  await extractFrame(item.videoPath,Math.min(second.end-.05,second.start+Math.max(.1,(second.end-second.start)/2)),path.join(frameDir,second.frame));
  item.shots.splice(idx+1,0,second);
  item.shots.forEach((shot,index)=>{shot.index=index+1;shot.startTc=timecode(shot.start);shot.endTc=timecode(shot.end);});
  item.analysisSummary=null;
  item.storyboard=storyboardMarkdown(item);
  return saveProject(item);
});
