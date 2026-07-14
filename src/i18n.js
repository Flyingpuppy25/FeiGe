(function initializeFeiGeI18n() {
  'use strict';

  const STORAGE_KEY = 'feige.uiLanguage';
  const DEFAULT_LOCALE = 'zh-CN';
  const SUPPORTED_LOCALES = new Set(['zh-CN', 'en-US']);

  const messages = {
    'zh-CN': {
      'app.name': 'FeiGe',
      'app.subtitle': 'AI STORYBOARD',

      'brand.subtitle': 'VIDEO BREAKDOWN',
      'status.ready': '本地工作区已就绪',
      'common.shots': '镜头',
      'nav.newProject': '新建拆片项目',
      'nav.newResearch': '新建风格研究',
      'nav.settings': '设置',

      'empty.eyebrow': 'LOCAL VIDEO WORKBENCH',
      'empty.title': '把视频拆成可执行的镜头语言',
      'empty.description': '导入视频后，FeiGe 会在本机完成硬切拆镜、代表帧提取、AI 镜头识别、剧本整理与成品导出。',
      'empty.stepImport': '导入视频',
      'empty.stepImportHint': '读取本地素材',
      'empty.stepSplit': '自动拆镜',
      'empty.stepSplitHint': '依据真实硬切点',
      'empty.stepAnalyze': '识别镜头',
      'empty.stepAnalyzeHint': '连接你的大模型',
      'empty.stepExport': '整理导出',
      'empty.stepExportHint': 'Word · Excel · HTML',

      'top.openFolder': '项目文件夹',
      'export.menu': '分别导出',
      'export.word': 'Word 剧本',
      'export.excel': 'Excel 分镜表',
      'export.html': 'HTML 成品页',
      'export.all': '导出全部',

      'video.source': 'SOURCE MONITOR',
      'video.preview': '视频监看',
      'video.sceneSplit': '场景拆分',
      'video.adaptive': '四检测器混合拆镜 · 自动融合转场',
      'video.autoSplit': '自动拆镜',

      'editor.shots': '分镜表',
      'editor.script': '剧本',
      'editor.retryFailed': '重试失败',
      'editor.analyzeAll': 'AI 识别全部镜头',
      'editor.generateScript': 'AI 生成剧本',
      'script.localHint': '修改同步保存到当前版本',
      'script.save': '保存当前版本',
      'script.version': '剧本版本',
      'script.regenerate': '重新生成',
      'script.deleteVersion': '删除版本',
      'script.rawEdit': '全文编辑',
      'script.noVersions': '尚未生成版本',
      'script.unknownProvider': '未记录模型',
      'script.sceneNumber': '场景 {number}',
      'script.sceneLabel': '场景 {number}',
      'script.emptyTitle': '还没有剧本',
      'script.emptyBody': '识别分镜后生成剧本，或从全文编辑开始。',
      'script.sceneEyebrow': 'SCRIPT SCENE',
      'script.sceneSource': '场景原文',
      'script.editSceneTitle': '编辑场景 {number}',
      'script.insertSceneTitle': '在场景 {number} 后插入',
      'script.newScene': '新场景 日/内',

      'timeline.difference': '镜头差异',
      'timeline.rightClick': '右键增加切点',
      'timeline.hint': '单击定位视频，右键在当前位置增加切点',

      'dialog.new.eyebrow': 'NEW WORKSPACE',
      'dialog.new.description': '选择一个本地视频，创建独立的拆片工作区。',
      'dialog.new.name': '项目名称',
      'dialog.new.namePlaceholder': '默认使用视频文件名',
      'dialog.new.video': '视频文件',
      'dialog.new.videoPlaceholder': '选择 MP4 / MOV / MKV…',
      'dialog.new.choose': '选择视频',
      'dialog.new.create': '创建并打开',

      'settings.eyebrow': 'LOCAL & PRIVATE',
      'settings.title': '模型与拆片设置',
      'settings.description': '连接你自己的模型接口，密钥只保存在本机。',
      'settings.providerTitle': '模型接口',
      'settings.providerHint': '选择预设，或添加任意 OpenAI 兼容接口',
      'settings.splitTitle': '拆镜与识别',
      'settings.splitHint': '混合检测融合硬切、白闪、渐隐渐现和叠化',
      'settings.autoAnalyzeHint': '拆镜完成后直接调用当前模型',
      'settings.unlimited': '切点根据视频转场自动分配；达到上限时保留置信度最高的切点。',
      'settings.save': '保存设置',

      'progress.task': '当前任务',
      'progress.cancel': '取消批量识别',

      'a11y.editorTabs': '分镜与剧本视图',
      'a11y.sceneFilters': '场景筛选',
      'a11y.providers': '模型接口列表',

      'common.add': '添加',
      'common.cancel': '取消',
      'common.close': '关闭',
      'common.confirm': '确认',
      'common.create': '创建',
      'common.delete': '删除',
      'common.edit': '编辑',
      'common.insertAfter': '在后面插入',
      'common.retry': '重试',
      'common.save': '保存',
      'common.select': '选择',
      'common.settings': '设置',
      'common.all': '全部',
      'common.none': '无',

      'shot.editEyebrow': 'SHOT EDITOR',
      'shot.editTitle': '编辑镜头 {number} · {start}–{end}',

      'field.scene': '场景',
      'field.timeOfDay': '时间',
      'field.interiorExterior': '内外景',
      'field.shotSize': '景别',
      'field.angle': '角度',
      'field.movement': '运镜',
      'field.description': '画面描述',
      'field.dialogue': '台词 / 字幕',
      'field.sound': '声音 / 音效',

      'nav.projects': '项目',
      'nav.research': '风格研究',
      'nav.empty': '暂无内容',
      'nav.localReady': '本地工作区已就绪',

      'hero.title': '把视频，拆成可复用的创作语言',
      'hero.description': '导入视频后，FeiGe 会完成场景切分、抽帧、镜头识别、剧本整理与风格研究。',
      'hero.newProject': '新建拆片项目',

      'project.kind.project': '拆片项目',
      'project.kind.research': '风格研究',
      'project.kind.shortProject': '项目',
      'project.kind.shortResearch': '研究',
      'project.shotCount': '{count} 个镜头',
      'project.shotCountOne': '{count} 个镜头',
      'project.untitled': '未命名项目',
      'project.moreActions': '{name} 的更多操作',
      'project.rename': '重命名',
      'project.openFolder': '在文件夹中打开',
      'project.delete': '删除项目',
      'project.manageEyebrow': 'PROJECT MANAGEMENT',
      'project.renameTitle': '重命名项目',

      'research.pipeline': '处理流水',
      'research.waiting': '等待开始',
      'research.running': '处理中',
      'research.complete': '已完成',
      'research.failed': '处理失败',
      'research.prepare': '准备',
      'research.split': '分镜拆解',
      'research.collage': '构建拼图',
      'research.refine': 'AI 提炼',
      'research.run': '开始风格研究',
      'research.report': '风格报告',
      'research.reportVersion': '报告版本',
      'research.refineAgain': '重新 AI 提炼',
      'research.rawReport': '报告全文编辑',
      'research.localHint': '修改同步保存到当前报告版本',
      'research.saveReport': '保存当前报告',
      'research.reportPlaceholder': 'AI 提炼的风格报告会显示在这里，也可以直接编辑…',
      'research.emptyTitle': '还没有风格报告',
      'research.emptyBody': '点击“开始风格研究”，依次完成准备、分镜拆解、构建拼图和 AI 提炼。',
      'research.detail.prepareRunning': '正在读取视频与研究参数…',
      'research.detail.prepareDone': '准备完成',
      'research.detail.splitRunning': '正在进行分镜拆解…',
      'research.detail.splitDone': '已拆解 {count} 个镜头',
      'research.detail.collageRunning': '正在构建代表镜头拼图…',
      'research.detail.collageDone': '镜头拼图已生成',
      'research.detail.refineRunning': '正在调用 AI 提炼视觉风格…',
      'research.detail.refineAgain': '正在重新调用 AI 提炼视觉风格…',
      'research.detail.refineDone': '风格研究已完成',
      'research.detail.versionDone': '风格报告新版本已保存',

      'toolbar.openFolder': '项目文件夹',
      'toolbar.exportWord': 'Word 剧本',
      'toolbar.exportExcel': 'Excel 分镜',
      'toolbar.exportHtml': 'HTML 成品页',
      'toolbar.exportAll': '一键导出全部',

      'video.sceneDifference': '场景差异',
      'video.autoCutHint': '自适应硬切 · 无数量上限',
      'video.manualCut': '在当前时间加分镜',
      'video.detect': '自动拆镜',

      'tab.storyboard': '分镜表',
      'tab.script': '剧本',

      'action.newProject': '新建拆片项目',
      'action.newResearch': '新建风格研究',
      'action.chooseVideo': '选择视频',
      'action.createOpen': '创建并打开',
      'action.retryFailed': '重试失败镜头',
      'action.analyzeAll': 'AI 识别全部镜头',
      'action.analyzeShot': '识别镜头',
      'action.reanalyze': '重新识别',
      'action.generateScript': 'AI 生成剧本',
      'action.saveScript': '保存剧本',
      'action.testProvider': '测试当前接口与图片识别',
      'action.testAllProviders': '测试全部已配置接口',
      'action.addProvider': '＋ 自定义接口',
      'action.saveSettings': '保存设置',
      'action.cancelAnalysis': '取消批量识别',

      'filter.all': '全部',

      'shot.label': '镜头 {index}',
      'shot.number': '镜 #{index}',
      'shot.status.running': '识别中',
      'shot.status.success': '已识别',
      'shot.status.failed': '失败',
      'shot.status.pending': '待识别',
      'shot.unrecognized': '尚未进行 AI 镜头识别',
      'shot.dialogue': '台词/字幕：{value}',
      'shot.sound': '声音：{value}',
      'shot.failureReason': '失败原因：{value}',
      'shot.scene': '场景',
      'shot.timeOfDay': '时间',
      'shot.interiorExterior': '内外景',
      'shot.shotSize': '景别',
      'shot.angle': '角度',
      'shot.movement': '运镜',
      'shot.description': '画面描述',

      'shots.emptyTitle': '还没有分镜',
      'shots.emptyBody': '点击“自动拆镜”，或在视频播放到目标位置时手动添加切点。',
      'shots.summary': '识别进度：{completed}/{total}，成功 {success}，失败 {failed}{cancelled}',
      'shots.summaryCancelled': '（已取消）',

      'script.placeholder': '剧本会显示在这里，也可以直接编辑…',

      'dialog.newEyebrow': 'NEW WORKSPACE',
      'dialog.newProject': '新建拆片项目',
      'dialog.newResearch': '新建风格研究',
      'dialog.settingsEyebrow': 'LOCAL & PRIVATE',
      'dialog.settingsTitle': '模型与拆片设置',

      'field.projectName': '项目名称',
      'field.videoFile': '视频文件',
      'field.displayName': '显示名称',
      'field.apiType': '接口类型',
      'field.baseUrl': 'Base URL',
      'field.modelName': '模型名称',
      'field.apiKey': 'API Key',

      'placeholder.defaultVideoName': '默认使用视频文件名',
      'placeholder.chooseVideo': '选择 MP4 / MOV / MKV…',
      'placeholder.apiKey': '请输入 API Key',
      'placeholder.apiKeySaved': '密钥已安全保存；留空则保持不变',
      'placeholder.apiKeyDecryptError': '已保存的密钥无法解密，请重新填写',

      'settings.provider': '模型接口',
      'settings.openaiCompatible': 'OpenAI 兼容',
      'settings.apiKeySaved': '本机已有密钥',
      'settings.connectionTest': 'API 连接测试',
      'settings.connectionTestHint': '发送一次最小请求，验证地址、密钥和模型是否可用',
      'settings.connectionSuccess': '连接成功',
      'settings.detectionMode': '切割方式',
      'settings.hybrid': '混合检测（推荐）',
      'settings.hybridHint': '硬切、白闪、渐隐渐现与叠化融合',
      'settings.classic': '经典帧差检测',
      'settings.classicHint': '速度快，适合纯硬切素材',
      'settings.hardCutFloor': '硬切最低帧差（%）',
      'settings.relativeMultiplier': '硬切相对倍率',
      'settings.classicThreshold': '经典帧差阈值',
      'settings.minGap': '最小峰值间隔（秒）',
      'settings.maxShots': '最大分镜数',
      'settings.concurrency': 'AI 并发数',
      'settings.autoAnalyze': '自动拆镜后立即识别全部镜头',
      'settings.thresholdHelp': '硬切阈值由每个视频的变化分布自动计算，镜头数量不设上限。',
      'settings.shotPrompt': '逐镜识别提示词',
      'settings.scriptPrompt': '剧本生成提示词',
      'settings.privacy': 'API Key 仅保存在本机，并使用 Windows 加密能力保护；分享压缩包时不会携带密钥。',
      'settings.language': '界面语言',
      'settings.languageChinese': '中文',
      'settings.languageEnglish': 'English',

      'provider.openai': 'OpenAI',
      'provider.anthropic': 'Claude',
      'provider.gemini': 'Gemini',
      'provider.deepseek': 'DeepSeek',
      'provider.qwen': '通义千问',
      'provider.custom': '自定义接口',
      'provider.hasKey': '本机已有密钥',

      'format.word': 'Word 文档',
      'format.excel': 'Excel 工作簿',
      'format.html': '离线网页',

      'progress.processing': '处理中…',
      'progress.working': '正在处理…',
      'progress.analyzingScene': '正在分析场景变化…',
      'progress.analyzingScenePct': '正在分析场景变化 {percent}%',
      'progress.extractingFrames': '正在提取代表帧 {current}/{total}',
      'progress.sceneComplete': '拆镜完成',
      'progress.retryingFailed': '正在重试失败镜头…',
      'progress.analyzingAll': '正在识别全部镜头…',
      'progress.analyzingOne': '正在识别这一镜…',
      'progress.preparingShots': '准备识别 {total} 个镜头…',
      'progress.analyzingShot': 'AI 识别中 {completed}/{total} · 当前镜头 #{index}',
      'progress.analyzingSummary': 'AI 识别中 {completed}/{total} · 成功 {success} · 失败 {failed}',
      'progress.safeCancel': '正在安全取消，当前请求结束后停止…',
      'progress.cancelled': '已取消批量识别',
      'progress.complete': '识别完成：成功 {success}，失败 {failed}',
      'progress.generatingExport': '正在生成导出文件…',
      'progress.generatingFormat': '正在生成 {format}…',
      'progress.generatingScriptFirst': '正在先生成专业剧本…',
      'progress.generatingScript': '正在生成专业剧本…',
      'progress.generatingScriptFromShots': '正在根据完整分镜生成剧本…',
      'progress.runningResearch': '正在执行风格研究四阶段流程…',
      'progress.refiningResearch': '正在重新提炼视觉风格…',
      'progress.deletingProject': '正在删除本地项目…',
      'progress.preparingScriptMedia': '正在准备剧本分析素材…',
      'progress.callingScriptModel': '正在调用模型生成剧本…',
      'progress.scriptVersionSaved': '剧本新版本已保存',
      'progress.generatingAllFiles': '正在生成 HTML、Excel 和 Word…',
      'progress.packagingZip': '正在打包分享压缩包…',
      'progress.exportComplete': '导出完成',
      'progress.allFilesComplete': '三种成品与分享压缩包已生成',
      'progress.testingProvider': '正在测试接口与图片识别…',
      'progress.testingProviders': '正在测试全部接口…',

      'toast.videoRequired': '请先选择视频',
      'toast.shotsCreated': '已生成 {count} 个镜头',
      'toast.cutAdded': '已添加切点',
      'toast.shotComplete': '镜头识别完成',
      'toast.batchComplete': '识别完成：成功 {success}，失败 {failed}',
      'toast.allShotsComplete': '全部 {count} 个镜头识别完成',
      'toast.scriptGenerated': '剧本生成完成',
      'toast.scriptSaved': '剧本已保存',
      'toast.shotSaved': '镜头修改已保存',
      'toast.shotDeleted': '镜头已删除并重新排列',
      'toast.sceneSaved': '场景修改已保存',
      'toast.sceneDeleted': '场景已删除',
      'toast.versionActivated': '已切换剧本版本',
      'toast.versionDeleted': '剧本版本已删除',
      'toast.settingsSaved': '设置已安全保存',
      'toast.exportComplete': '导出完成',
      'toast.exportAllComplete': '三种成品已全部导出',
      'toast.connectionSuccess': '连接成功：{message}',
      'toast.allConnectionsSuccess': '全部 {total} 个已配置接口连接成功',
      'toast.someConnectionsFailed': '接口测试完成：{connected}/{total} 个连接成功',
      'toast.projectRenamed': '项目已重命名',
      'toast.projectDeleted': '项目及本地文件已删除',
      'toast.researchComplete': '风格研究四阶段流程已完成',
      'toast.researchRefined': '风格报告新版本已保存',

      'error.unexpected': '发生未知错误：{detail}',
      'error.detectFailed': '拆镜失败：{detail}',
      'error.batchFailed': '批量识别失败：{detail}',
      'error.shotFailed': '镜头识别失败：{detail}',
      'error.exportFailed': '导出失败：{detail}',
      'error.scriptFailed': '剧本生成失败：{detail}',
      'error.connectionFailed': '连接测试失败：{detail}',
      'error.researchFailed': '风格研究失败：{detail}',
      'error.projectNameRequired': '项目名称不能为空',
      'error.commandExit': '{command} 退出码 {code}',
      'error.videoMetadata': '无法读取视频尺寸或时长',
      'error.videoDecode': '视频解码失败：{detail}',
      'error.apiResponse': '接口返回 {status}{detail}',
      'error.requestTimeout': '接口请求超过 {seconds} 秒',
      'error.network': '网络请求失败：{detail}',
      'error.missingBaseUrl': '{provider} 未填写 Base URL',
      'error.missingModel': '{provider} 未填写模型名称',
      'error.emptyModelResponse': '模型未返回文字内容（{reason}）',
      'error.providerMissing': '当前模型接口不存在，请重新选择接口',
      'error.keyDecrypt': '本机无法解密已保存的 API Key，请在设置中重新填写并保存',
      'error.keyMissing': '请先在设置中填写 {provider} API Key',
      'error.modelCall': '模型调用失败',
      'error.invalidJson': '模型返回的内容不是有效 JSON',
      'error.missingDescription': '结构化结果缺少画面描述',
      'error.shotMissing': '镜头不存在',
      'error.analysisRunning': '已有识别任务正在运行',
      'error.detectFirst': '请先完成自动拆镜',
      'error.noTestProject': '没有可用于测试的已拆镜项目',
      'error.unsupportedExport': '不支持的导出格式',
      'error.frameUnreadable': '镜 {shot} 的关键帧不可读取：{source}',
      'error.framePathMissing': '未提供路径',
      'error.selectExportFolder': '请选择导出文件夹',
      'error.shotLocked': '镜头正在识别，暂时不能编辑或删除',
      'error.versionChanged': '剧本版本已经变化，编辑窗口已关闭，请重新打开',
      'error.versionMissing': '剧本版本不存在或已经删除',

      'confirm.deleteShot': '确定删除镜头 {number}？相邻镜头的时间区间会自动补齐。',
      'confirm.deleteScene': '确定删除场景 {number}？',
      'confirm.deleteVersion': '确定删除当前剧本版本？此操作不能撤销。',
      'confirm.deleteProject': '确定永久删除“{name}”及其全部本地文件？此操作不能撤销。',

      'a11y.sidebar': '项目导航',
      'a11y.main': 'FeiGe 工作区',
      'a11y.projectActions': '项目操作',
      'a11y.settings': '打开设置',
      'a11y.addProject': '添加拆片项目',
      'a11y.addResearch': '添加风格研究',
      'a11y.closeDialog': '关闭对话框',
      'a11y.videoPlayer': '源视频播放器',
      'a11y.providerNavigation': '模型接口列表',
      'a11y.taskProgress': '任务进度',
      'a11y.language': '界面语言',
      'a11y.switchToEnglish': '切换为 English',
      'a11y.switchToChinese': '切换为中文',
      'a11y.shotFrame': '镜头 {index} 关键帧'
    },

    'en-US': {
      'app.name': 'FeiGe',
      'app.subtitle': 'AI STORYBOARD',

      'brand.subtitle': 'VIDEO BREAKDOWN',
      'status.ready': 'Local workspace ready',
      'common.shots': 'Shots',
      'nav.newProject': 'New Breakdown',
      'nav.newResearch': 'New Style Study',
      'nav.settings': 'Settings',

      'empty.eyebrow': 'LOCAL VIDEO WORKBENCH',
      'empty.title': 'Turn video into an actionable shot language',
      'empty.description': 'Import a video and FeiGe handles hard-cut detection, representative frames, AI shot analysis, script organization, and exports locally.',
      'empty.stepImport': 'Import video',
      'empty.stepImportHint': 'Read local footage',
      'empty.stepSplit': 'Detect cuts',
      'empty.stepSplitHint': 'Follow real hard cuts',
      'empty.stepAnalyze': 'Analyze shots',
      'empty.stepAnalyzeHint': 'Use your own AI model',
      'empty.stepExport': 'Organize & export',
      'empty.stepExportHint': 'Word · Excel · HTML',

      'top.openFolder': 'Project Folder',
      'export.menu': 'Export As',
      'export.word': 'Word Script',
      'export.excel': 'Excel Storyboard',
      'export.html': 'HTML Presentation',
      'export.all': 'Export All',

      'video.source': 'SOURCE MONITOR',
      'video.preview': 'Video Preview',
      'video.sceneSplit': 'Scene Detection',
      'video.adaptive': 'Four-detector hybrid cuts · Transition fusion',
      'video.autoSplit': 'Detect Cuts',

      'editor.shots': 'Shot List',
      'editor.script': 'Script',
      'editor.retryFailed': 'Retry Failed',
      'editor.analyzeAll': 'Analyze All Shots',
      'editor.generateScript': 'Generate Script',
      'script.localHint': 'Changes are saved to the active version',
      'script.save': 'Save Current Version',
      'script.version': 'Script Version',
      'script.regenerate': 'Regenerate',
      'script.deleteVersion': 'Delete Version',
      'script.rawEdit': 'Full-text Editor',
      'script.noVersions': 'No generated versions yet',
      'script.unknownProvider': 'Model not recorded',
      'script.sceneNumber': 'Scene {number}',
      'script.sceneLabel': 'Scene {number}',
      'script.emptyTitle': 'No script yet',
      'script.emptyBody': 'Analyze the shots and generate a script, or begin in the full-text editor.',
      'script.sceneEyebrow': 'SCRIPT SCENE',
      'script.sceneSource': 'Scene Source',
      'script.editSceneTitle': 'Edit Scene {number}',
      'script.insertSceneTitle': 'Insert After Scene {number}',
      'script.newScene': 'New Scene Day/INT',

      'timeline.difference': 'Shot Difference',
      'timeline.rightClick': 'Right-click to add a cut',
      'timeline.hint': 'Click to seek; right-click to add a cut at that time',

      'dialog.new.eyebrow': 'NEW WORKSPACE',
      'dialog.new.description': 'Choose a local video to create an independent breakdown workspace.',
      'dialog.new.name': 'Project Name',
      'dialog.new.namePlaceholder': 'Defaults to the video filename',
      'dialog.new.video': 'Video File',
      'dialog.new.videoPlaceholder': 'Choose MP4 / MOV / MKV…',
      'dialog.new.choose': 'Choose Video',
      'dialog.new.create': 'Create & Open',

      'settings.eyebrow': 'LOCAL & PRIVATE',
      'settings.title': 'Models & Breakdown',
      'settings.description': 'Connect your own model providers. Keys remain on this device.',
      'settings.providerTitle': 'Model Providers',
      'settings.providerHint': 'Choose a preset or add any OpenAI-compatible endpoint',
      'settings.splitTitle': 'Cuts & Analysis',
      'settings.splitHint': 'Hybrid detection fuses hard cuts, flashes, fades, and dissolves',
      'settings.autoAnalyzeHint': 'Call the selected model as soon as cuts are ready',
      'settings.unlimited': 'Cuts follow the video transitions. At the limit, the highest-confidence cuts are retained.',
      'settings.save': 'Save Settings',

      'progress.task': 'CURRENT TASK',
      'progress.cancel': 'Cancel Batch Analysis',

      'a11y.editorTabs': 'Shot list and script views',
      'a11y.sceneFilters': 'Scene filters',
      'a11y.providers': 'Model provider list',

      'common.add': 'Add',
      'common.cancel': 'Cancel',
      'common.close': 'Close',
      'common.confirm': 'Confirm',
      'common.create': 'Create',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.insertAfter': 'Insert After',
      'common.retry': 'Retry',
      'common.save': 'Save',
      'common.select': 'Select',
      'common.settings': 'Settings',
      'common.all': 'All',
      'common.none': 'None',

      'shot.editEyebrow': 'SHOT EDITOR',
      'shot.editTitle': 'Edit Shot {number} · {start}–{end}',

      'field.scene': 'Scene',
      'field.timeOfDay': 'Time of Day',
      'field.interiorExterior': 'Interior / Exterior',
      'field.shotSize': 'Shot Size',
      'field.angle': 'Angle',
      'field.movement': 'Camera Movement',
      'field.description': 'Visual Description',
      'field.dialogue': 'Dialogue / Captions',
      'field.sound': 'Sound / Effects',

      'nav.projects': 'Projects',
      'nav.research': 'Style Studies',
      'nav.empty': 'Nothing here yet',
      'nav.localReady': 'Local workspace ready',

      'hero.title': 'Turn video into reusable visual language',
      'hero.description': 'Import a video to detect cuts, extract keyframes, analyze shots, organize scripts, and study visual style.',
      'hero.newProject': 'New Breakdown Project',

      'project.kind.project': 'Breakdown Project',
      'project.kind.research': 'Style Study',
      'project.kind.shortProject': 'Project',
      'project.kind.shortResearch': 'Study',
      'project.shotCount': '{count} shots',
      'project.shotCountOne': '{count} shot',
      'project.untitled': 'Untitled Project',
      'project.moreActions': 'More actions for {name}',
      'project.rename': 'Rename',
      'project.openFolder': 'Open in Folder',
      'project.delete': 'Delete Project',
      'project.manageEyebrow': 'PROJECT MANAGEMENT',
      'project.renameTitle': 'Rename Project',

      'research.pipeline': 'Processing Pipeline',
      'research.waiting': 'Waiting to start',
      'research.running': 'Processing',
      'research.complete': 'Complete',
      'research.failed': 'Failed',
      'research.prepare': 'Prepare',
      'research.split': 'Break Down Shots',
      'research.collage': 'Build Collage',
      'research.refine': 'AI Synthesis',
      'research.run': 'Start Style Study',
      'research.report': 'Style Report',
      'research.reportVersion': 'Report Version',
      'research.refineAgain': 'Run AI Synthesis Again',
      'research.rawReport': 'Full Report Editor',
      'research.localHint': 'Changes are saved to the active report version',
      'research.saveReport': 'Save Current Report',
      'research.reportPlaceholder': 'The AI style report appears here. You can also edit it directly…',
      'research.emptyTitle': 'No style report yet',
      'research.emptyBody': 'Select “Start Style Study” to prepare, break down shots, build a collage, and run AI synthesis.',
      'research.detail.prepareRunning': 'Reading the video and study parameters…',
      'research.detail.prepareDone': 'Preparation complete',
      'research.detail.splitRunning': 'Breaking the video into shots…',
      'research.detail.splitDone': 'Created {count} shots',
      'research.detail.collageRunning': 'Building the representative-shot collage…',
      'research.detail.collageDone': 'Shot collage created',
      'research.detail.refineRunning': 'Running AI visual-style synthesis…',
      'research.detail.refineAgain': 'Running AI visual-style synthesis again…',
      'research.detail.refineDone': 'Style study complete',
      'research.detail.versionDone': 'New style report version saved',

      'toolbar.openFolder': 'Project Folder',
      'toolbar.exportWord': 'Word Script',
      'toolbar.exportExcel': 'Excel Storyboard',
      'toolbar.exportHtml': 'HTML Presentation',
      'toolbar.exportAll': 'Export All',

      'video.sceneDifference': 'Scene Difference',
      'video.autoCutHint': 'Adaptive hard cuts · No shot limit',
      'video.manualCut': 'Add Shot at Playhead',
      'video.detect': 'Auto Detect Cuts',

      'tab.storyboard': 'Shot List',
      'tab.script': 'Script',

      'action.newProject': 'New Breakdown Project',
      'action.newResearch': 'New Style Study',
      'action.chooseVideo': 'Choose Video',
      'action.createOpen': 'Create and Open',
      'action.retryFailed': 'Retry Failed Shots',
      'action.analyzeAll': 'Analyze All Shots',
      'action.analyzeShot': 'Analyze Shot',
      'action.reanalyze': 'Analyze Again',
      'action.generateScript': 'Generate Script',
      'action.saveScript': 'Save Script',
      'action.testProvider': 'Test API and Image Analysis',
      'action.testAllProviders': 'Test All Configured APIs',
      'action.addProvider': '＋ Custom API',
      'action.saveSettings': 'Save Settings',
      'action.cancelAnalysis': 'Cancel Batch Analysis',

      'filter.all': 'All',

      'shot.label': 'Shot {index}',
      'shot.number': 'Shot #{index}',
      'shot.status.running': 'Analyzing',
      'shot.status.success': 'Analyzed',
      'shot.status.failed': 'Failed',
      'shot.status.pending': 'Pending',
      'shot.unrecognized': 'This shot has not been analyzed yet',
      'shot.dialogue': 'Dialogue / Captions: {value}',
      'shot.sound': 'Sound: {value}',
      'shot.failureReason': 'Failure reason: {value}',
      'shot.scene': 'Scene',
      'shot.timeOfDay': 'Time of Day',
      'shot.interiorExterior': 'Interior / Exterior',
      'shot.shotSize': 'Shot Size',
      'shot.angle': 'Angle',
      'shot.movement': 'Camera Movement',
      'shot.description': 'Visual Description',

      'shots.emptyTitle': 'No shots yet',
      'shots.emptyBody': 'Select “Auto Detect Cuts,” or play the video and add a shot at the current position.',
      'shots.summary': 'Progress: {completed}/{total} · {success} succeeded · {failed} failed{cancelled}',
      'shots.summaryCancelled': ' (cancelled)',

      'script.placeholder': 'The generated script appears here. You can also edit it directly…',

      'dialog.newEyebrow': 'NEW WORKSPACE',
      'dialog.newProject': 'New Breakdown Project',
      'dialog.newResearch': 'New Style Study',
      'dialog.settingsEyebrow': 'LOCAL & PRIVATE',
      'dialog.settingsTitle': 'Models and Breakdown Settings',

      'field.projectName': 'Project Name',
      'field.videoFile': 'Video File',
      'field.displayName': 'Display Name',
      'field.apiType': 'API Type',
      'field.baseUrl': 'Base URL',
      'field.modelName': 'Model',
      'field.apiKey': 'API Key',

      'placeholder.defaultVideoName': 'Uses the video filename by default',
      'placeholder.chooseVideo': 'Choose MP4 / MOV / MKV…',
      'placeholder.apiKey': 'Enter API Key',
      'placeholder.apiKeySaved': 'Key saved securely; leave blank to keep it',
      'placeholder.apiKeyDecryptError': 'The saved key cannot be decrypted; enter it again',

      'settings.provider': 'Model Provider',
      'settings.openaiCompatible': 'OpenAI Compatible',
      'settings.apiKeySaved': 'Key saved on this device',
      'settings.connectionTest': 'API Connection Test',
      'settings.connectionTestHint': 'Send one minimal request to verify the endpoint, key, and model',
      'settings.connectionSuccess': 'Connected',
      'settings.detectionMode': 'Detection Method',
      'settings.hybrid': 'Hybrid Detection (Recommended)',
      'settings.hybridHint': 'Fuses hard cuts, flashes, fades, and dissolves',
      'settings.classic': 'Classic Frame Difference',
      'settings.classicHint': 'Fast and suited to hard-cut footage',
      'settings.hardCutFloor': 'Hard-cut Minimum Difference (%)',
      'settings.relativeMultiplier': 'Hard-cut Relative Multiplier',
      'settings.classicThreshold': 'Classic Difference Threshold',
      'settings.minGap': 'Minimum Cut Interval (sec)',
      'settings.maxShots': 'Maximum Shots',
      'settings.concurrency': 'Concurrent AI Requests',
      'settings.autoAnalyze': 'Analyze all shots after automatic cut detection',
      'settings.thresholdHelp': 'The hard-cut threshold is calculated from each video. There is no limit on the number of shots.',
      'settings.shotPrompt': 'Shot Analysis Prompt',
      'settings.scriptPrompt': 'Script Generation Prompt',
      'settings.privacy': 'API keys stay on this device and are protected with Windows encryption. Shared ZIP files never include your keys.',
      'settings.language': 'Interface Language',
      'settings.languageChinese': '中文',
      'settings.languageEnglish': 'English',

      'provider.openai': 'OpenAI',
      'provider.anthropic': 'Claude',
      'provider.gemini': 'Gemini',
      'provider.deepseek': 'DeepSeek',
      'provider.qwen': 'Qwen',
      'provider.custom': 'Custom API',
      'provider.hasKey': 'Key saved on this device',

      'format.word': 'Word document',
      'format.excel': 'Excel workbook',
      'format.html': 'offline webpage',

      'progress.processing': 'Processing…',
      'progress.working': 'Working…',
      'progress.analyzingScene': 'Analyzing scene changes…',
      'progress.analyzingScenePct': 'Analyzing scene changes {percent}%',
      'progress.extractingFrames': 'Extracting representative frames {current}/{total}',
      'progress.sceneComplete': 'Cut detection complete',
      'progress.retryingFailed': 'Retrying failed shots…',
      'progress.analyzingAll': 'Analyzing all shots…',
      'progress.analyzingOne': 'Analyzing this shot…',
      'progress.preparingShots': 'Preparing to analyze {total} shots…',
      'progress.analyzingShot': 'Analyzing {completed}/{total} · Current shot #{index}',
      'progress.analyzingSummary': 'Analyzing {completed}/{total} · {success} succeeded · {failed} failed',
      'progress.safeCancel': 'Cancelling safely. Analysis will stop after the current request…',
      'progress.cancelled': 'Batch analysis cancelled',
      'progress.complete': 'Analysis finished: {success} succeeded, {failed} failed',
      'progress.generatingExport': 'Generating export files…',
      'progress.generatingFormat': 'Generating {format}…',
      'progress.generatingScriptFirst': 'Generating a professional script first…',
      'progress.generatingScript': 'Generating professional script…',
      'progress.generatingScriptFromShots': 'Generating script from the complete shot list…',
      'progress.runningResearch': 'Running the four-stage style study…',
      'progress.refiningResearch': 'Running visual style synthesis again…',
      'progress.deletingProject': 'Deleting the local project…',
      'progress.preparingScriptMedia': 'Preparing media for script analysis…',
      'progress.callingScriptModel': 'Generating the script with the selected model…',
      'progress.scriptVersionSaved': 'New script version saved',
      'progress.generatingAllFiles': 'Generating HTML, Excel, and Word files…',
      'progress.packagingZip': 'Creating shareable ZIP…',
      'progress.exportComplete': 'Export complete',
      'progress.allFilesComplete': 'All three deliverables and the shareable ZIP are ready',
      'progress.testingProvider': 'Testing API and image analysis…',
      'progress.testingProviders': 'Testing all configured APIs…',

      'toast.videoRequired': 'Choose a video first',
      'toast.shotsCreated': 'Created {count} shots',
      'toast.cutAdded': 'Cut point added',
      'toast.shotComplete': 'Shot analysis complete',
      'toast.batchComplete': 'Analysis finished: {success} succeeded, {failed} failed',
      'toast.allShotsComplete': 'All {count} shots analyzed',
      'toast.scriptGenerated': 'Script generated',
      'toast.scriptSaved': 'Script saved',
      'toast.shotSaved': 'Shot changes saved',
      'toast.shotDeleted': 'Shot deleted and timeline renumbered',
      'toast.sceneSaved': 'Scene changes saved',
      'toast.sceneDeleted': 'Scene deleted',
      'toast.versionActivated': 'Script version activated',
      'toast.versionDeleted': 'Script version deleted',
      'toast.settingsSaved': 'Settings saved securely',
      'toast.exportComplete': 'Export complete',
      'toast.exportAllComplete': 'All three deliverables exported',
      'toast.connectionSuccess': 'Connection successful: {message}',
      'toast.allConnectionsSuccess': 'All {total} configured APIs connected successfully',
      'toast.someConnectionsFailed': 'Connection test complete: {connected}/{total} APIs connected',
      'toast.projectRenamed': 'Project renamed',
      'toast.projectDeleted': 'Project and local files deleted',
      'toast.researchComplete': 'The four-stage style study is complete',
      'toast.researchRefined': 'A new style report version was saved',

      'error.unexpected': 'Unexpected error: {detail}',
      'error.detectFailed': 'Cut detection failed: {detail}',
      'error.batchFailed': 'Batch analysis failed: {detail}',
      'error.shotFailed': 'Shot analysis failed: {detail}',
      'error.exportFailed': 'Export failed: {detail}',
      'error.scriptFailed': 'Script generation failed: {detail}',
      'error.connectionFailed': 'Connection test failed: {detail}',
      'error.researchFailed': 'Style study failed: {detail}',
      'error.projectNameRequired': 'Project name is required',
      'error.commandExit': '{command} exited with code {code}',
      'error.videoMetadata': 'Could not read the video dimensions or duration',
      'error.videoDecode': 'Video decoding failed: {detail}',
      'error.apiResponse': 'API returned HTTP {status}{detail}',
      'error.requestTimeout': 'The API request timed out after {seconds} seconds',
      'error.network': 'Network request failed: {detail}',
      'error.missingBaseUrl': '{provider} does not have a Base URL',
      'error.missingModel': '{provider} does not have a model name',
      'error.emptyModelResponse': 'The model returned no text ({reason})',
      'error.providerMissing': 'The selected model provider no longer exists. Choose another provider.',
      'error.keyDecrypt': 'The saved API key cannot be decrypted on this device. Enter and save it again in Settings.',
      'error.keyMissing': 'Enter the {provider} API key in Settings first',
      'error.modelCall': 'Model request failed',
      'error.invalidJson': 'The model response is not valid JSON',
      'error.missingDescription': 'The structured response does not include a visual description',
      'error.shotMissing': 'The shot no longer exists',
      'error.analysisRunning': 'Another analysis task is already running',
      'error.detectFirst': 'Run automatic cut detection first',
      'error.noTestProject': 'There is no analyzed project available for this test',
      'error.unsupportedExport': 'Unsupported export format',
      'error.frameUnreadable': 'The keyframe for shot {shot} cannot be read: {source}',
      'error.framePathMissing': 'no path provided',
      'error.selectExportFolder': 'Choose an export folder',
      'error.shotLocked': 'This shot is being analyzed and cannot be edited or deleted',
      'error.versionChanged': 'The script version changed. The editor was closed; open it again.',
      'error.versionMissing': 'The script version does not exist or has been deleted',

      'confirm.deleteShot': 'Delete shot {number}? Adjacent shot timing will be repaired automatically.',
      'confirm.deleteScene': 'Delete scene {number}?',
      'confirm.deleteVersion': 'Delete the active script version? This cannot be undone.',
      'confirm.deleteProject': 'Permanently delete “{name}” and all of its local files? This cannot be undone.',

      'a11y.sidebar': 'Project navigation',
      'a11y.main': 'FeiGe workspace',
      'a11y.projectActions': 'Project actions',
      'a11y.settings': 'Open settings',
      'a11y.addProject': 'Add breakdown project',
      'a11y.addResearch': 'Add style study',
      'a11y.closeDialog': 'Close dialog',
      'a11y.videoPlayer': 'Source video player',
      'a11y.providerNavigation': 'Model provider list',
      'a11y.taskProgress': 'Task progress',
      'a11y.language': 'Interface language',
      'a11y.switchToEnglish': 'Switch to English',
      'a11y.switchToChinese': 'Switch to Chinese',
      'a11y.shotFrame': 'Keyframe for shot {index}'
    }
  };

  function normalizeLocale(value) {
    const locale = String(value || '').trim().toLowerCase();
    if (locale === 'zh' || locale.startsWith('zh-')) return 'zh-CN';
    if (locale === 'en' || locale.startsWith('en-')) return 'en-US';
    return null;
  }

  function systemLocale() {
    return normalizeLocale(typeof navigator !== 'undefined' ? navigator.language : '') || DEFAULT_LOCALE;
  }

  function storedLocale() {
    try {
      const saved = normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
      return saved && SUPPORTED_LOCALES.has(saved) ? saved : null;
    } catch {
      return null;
    }
  }

  let activeLocale = storedLocale() || systemLocale();

  function interpolate(template, params) {
    const values = params && typeof params === 'object' ? params : {};
    return String(template).replace(/\{([a-zA-Z0-9_]+)\}/g, (match, name) => {
      const value = values[name];
      return value === undefined || value === null ? match : String(value);
    });
  }

  function t(key, params) {
    const primary = messages[activeLocale] || messages[DEFAULT_LOCALE];
    const fallback = messages[DEFAULT_LOCALE];
    const template = Object.prototype.hasOwnProperty.call(primary, key)
      ? primary[key]
      : Object.prototype.hasOwnProperty.call(fallback, key)
        ? fallback[key]
        : key;
    return interpolate(template, params);
  }

  function getLocale() {
    return activeLocale;
  }

  function parseElementParams(element) {
    const raw = element.getAttribute('data-i18n-params');
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  function elementsFor(root, attribute) {
    const selector = `[${attribute}]`;
    const result = [];
    if (root && typeof root.matches === 'function' && root.matches(selector)) result.push(root);
    if (root && typeof root.querySelectorAll === 'function') result.push(...root.querySelectorAll(selector));
    return result;
  }

  function apply(root = document) {
    if (!root) return root;
    if (typeof document !== 'undefined') {
      document.documentElement.lang = activeLocale;
      document.documentElement.dir = 'ltr';
    }

    const bindings = [
      ['data-i18n', (element, value) => { element.textContent = value; }],
      ['data-i18n-text', (element, value) => { element.textContent = value; }],
      ['data-i18n-placeholder', (element, value) => { element.setAttribute('placeholder', value); }],
      ['data-i18n-title', (element, value) => { element.setAttribute('title', value); }],
      ['data-i18n-aria-label', (element, value) => { element.setAttribute('aria-label', value); }],
      ['data-i18n-value', (element, value) => { element.value = value; }]
    ];

    for (const [attribute, assign] of bindings) {
      for (const element of elementsFor(root, attribute)) {
        const key = element.getAttribute(attribute);
        if (key) assign(element, t(key, parseElementParams(element)));
      }
    }
    return root;
  }

  function setLocale(locale) {
    const normalized = normalizeLocale(locale);
    if (!normalized || !SUPPORTED_LOCALES.has(normalized)) return activeLocale;
    const previous = activeLocale;
    activeLocale = normalized;
    try { window.localStorage.setItem(STORAGE_KEY, activeLocale); } catch {}
    if (typeof document !== 'undefined') apply(document);
    if (previous !== activeLocale && typeof document !== 'undefined') {
      document.dispatchEvent(new CustomEvent('feige:localechange', { detail: { locale: activeLocale, previous } }));
    }
    return activeLocale;
  }

  const runtimeExact = {
    '本地工作区已就绪': 'nav.localReady',
    '处理中…': 'progress.processing',
    '正在处理…': 'progress.working',
    '正在分析场景变化…': 'progress.analyzingScene',
    '拆镜完成': 'progress.sceneComplete',
    '正在重试失败镜头…': 'progress.retryingFailed',
    '正在识别全部镜头…': 'progress.analyzingAll',
    '正在识别这一镜…': 'progress.analyzingOne',
    '正在安全取消，当前请求结束后停止…': 'progress.safeCancel',
    '已取消批量识别': 'progress.cancelled',
    '正在生成导出文件…': 'progress.generatingExport',
    '正在先生成专业剧本…': 'progress.generatingScriptFirst',
    '正在生成专业剧本…': 'progress.generatingScript',
    '正在根据完整分镜生成剧本…': 'progress.generatingScriptFromShots',
    '正在准备剧本分析素材…': 'progress.preparingScriptMedia',
    '正在调用模型生成剧本…': 'progress.callingScriptModel',
    '剧本新版本已保存': 'progress.scriptVersionSaved',
    '正在生成 HTML、Excel 和 Word…': 'progress.generatingAllFiles',
    '正在打包分享压缩包…': 'progress.packagingZip',
    '导出完成': 'progress.exportComplete',
    '三种成品与分享压缩包已生成': 'progress.allFilesComplete',
    '正在测试接口与图片识别…': 'progress.testingProvider',
    '正在读取视频与研究参数…': 'research.detail.prepareRunning',
    '准备完成': 'research.detail.prepareDone',
    '正在进行分镜拆解…': 'research.detail.splitRunning',
    '正在构建代表镜头拼图…': 'research.detail.collageRunning',
    '镜头拼图已生成': 'research.detail.collageDone',
    '正在调用 AI 提炼视觉风格…': 'research.detail.refineRunning',
    '正在重新调用 AI 提炼视觉风格…': 'research.detail.refineAgain',
    '风格研究已完成': 'research.detail.refineDone',
    '风格报告新版本已保存': 'research.detail.versionDone',
    '请先选择视频': 'toast.videoRequired',
    '已添加切点': 'toast.cutAdded',
    '镜头识别完成': 'toast.shotComplete',
    '剧本生成完成': 'toast.scriptGenerated',
    '剧本已保存': 'toast.scriptSaved',
    '设置已安全保存': 'toast.settingsSaved',
    '三种成品已全部导出': 'toast.exportAllComplete'
  };

  const runtimePatterns = [
    [/^正在分析场景变化\s+(\d+)%[.…]*$/, match => t('progress.analyzingScenePct', { percent: match[1] })],
    [/^正在提取代表帧\s+(\d+)\/(\d+)[.…]*$/, match => t('progress.extractingFrames', { current: match[1], total: match[2] })],
    [/^准备识别\s+(\d+)\s+个镜头[.…]*$/, match => t('progress.preparingShots', { total: match[1] })],
    [/^AI\s*识别中\s+(\d+)\/(\d+)\s*·\s*当前镜头\s*#(\d+)[.…]*$/, match => t('progress.analyzingShot', { completed: match[1], total: match[2], index: match[3] })],
    [/^AI\s*识别中\s+(\d+)\/(\d+)\s*·\s*成功\s+(\d+)\s*·\s*失败\s+(\d+)[.…]*$/, match => t('progress.analyzingSummary', { completed: match[1], total: match[2], success: match[3], failed: match[4] })],
    [/^识别完成[：:]\s*成功\s+(\d+)[，,]\s*失败\s+(\d+)$/, match => t('progress.complete', { success: match[1], failed: match[2] })],
    [/^风格研究失败[：:]\s*(.+)$/s, match => t('error.researchFailed', { detail: match[1] })],
    [/^识别进度[：:]\s*(\d+)\/(\d+)[，,]\s*成功\s+(\d+)[，,]\s*失败\s+(\d+)(（已取消）)?$/, match => t('shots.summary', { completed: match[1], total: match[2], success: match[3], failed: match[4], cancelled: match[5] ? t('shots.summaryCancelled') : '' })],
    [/^已生成\s+(\d+)\s+个镜头$/, match => t('toast.shotsCreated', { count: match[1] })],
    [/^已拆解\s+(\d+)\s+个镜头$/, match => t('research.detail.splitDone', { count: match[1] })],
    [/^全部\s+(\d+)\s+个镜头识别完成$/, match => t('toast.allShotsComplete', { count: match[1] })],
    [/^连接成功[：:]\s*(.+)$/, match => t('toast.connectionSuccess', { message: match[1] })],
    [/^正在生成\s+(.+?)[.…]+$/, match => {
      const formatKeys = { 'Word 文档': 'format.word', 'Excel 工作簿': 'format.excel', '离线网页': 'format.html' };
      const format = formatKeys[match[1]] ? t(formatKeys[match[1]]) : match[1];
      return t('progress.generatingFormat', { format });
    }]
  ];

  function localizeRuntimeMessage(message) {
    if (message && typeof message === 'object') {
      if (message.key && (messages[activeLocale][message.key] || messages[DEFAULT_LOCALE][message.key])) {
        return t(message.key, message.params || {});
      }
      message = message.message;
    }
    const raw = String(message || '').trim();
    if (!raw) return '';
    if (runtimeExact[raw]) return t(runtimeExact[raw]);
    for (const [pattern, translate] of runtimePatterns) {
      const match = raw.match(pattern);
      if (match) return translate(match);
    }
    return activeLocale === DEFAULT_LOCALE ? raw : t('progress.working');
  }

  const errorExact = {
    '无法读取视频尺寸或时长': 'error.videoMetadata',
    '当前模型接口不存在，请重新选择接口': 'error.providerMissing',
    '本机无法解密已保存的 API Key，请在设置中重新填写并保存': 'error.keyDecrypt',
    '模型调用失败': 'error.modelCall',
    '模型返回的内容不是有效 JSON': 'error.invalidJson',
    '结构化结果缺少画面描述': 'error.missingDescription',
    '镜头不存在': 'error.shotMissing',
    '镜头正在识别，暂时不能编辑': 'error.shotLocked',
    '镜头正在识别，暂时不能删除': 'error.shotLocked',
    '镜头正在识别，暂时不能增加切点': 'error.shotLocked',
    '剧本版本不存在': 'error.versionMissing',
    '已有识别任务正在运行': 'error.analysisRunning',
    '请先完成自动拆镜': 'error.detectFirst',
    '没有可用于测试的已拆镜项目': 'error.noTestProject',
    '不支持的导出格式': 'error.unsupportedExport',
    '请选择导出文件夹': 'error.selectExportFolder'
  };

  function stripElectronErrorPrefix(value) {
    let raw = String(value || '').trim();
    let previous;
    do {
      previous = raw;
      raw = raw
        .replace(/^Error invoking remote method '[^']+':\s*/i, '')
        .replace(/^Error:\s*/i, '')
        .trim();
    } while (raw !== previous);
    return raw;
  }

  function knownError(raw) {
    if (errorExact[raw]) return t(errorExact[raw]);

    const wrappers = [
      [/^拆镜失败[：:]\s*(.+)$/s, 'error.detectFailed'],
      [/^批量识别失败[：:]\s*(.+)$/s, 'error.batchFailed'],
      [/^镜头识别失败[：:]\s*(.+)$/s, 'error.shotFailed'],
      [/^导出失败[：:]\s*(.+)$/s, 'error.exportFailed'],
      [/^剧本生成失败[：:]\s*(.+)$/s, 'error.scriptFailed'],
      [/^连接测试失败[：:]\s*(.+)$/s, 'error.connectionFailed']
    ];
    for (const [pattern, key] of wrappers) {
      const match = raw.match(pattern);
      if (match) return t(key, { detail: knownError(stripElectronErrorPrefix(match[1])) || stripElectronErrorPrefix(match[1]) });
    }

    let match = raw.match(/^(.+?)\s+退出码\s+(-?\d+)$/);
    if (match) return t('error.commandExit', { command: match[1], code: match[2] });

    match = raw.match(/^视频解码失败[：:]\s*(.+)$/s);
    if (match) return t('error.videoDecode', { detail: match[1] });

    match = raw.match(/^接口返回\s+(\d+)(?:[：:]\s*(.*))?$/s);
    if (match) return t('error.apiResponse', { status: match[1], detail: match[2] ? `: ${match[2]}` : '' });

    match = raw.match(/^接口请求超过\s+(\d+)\s+秒$/);
    if (match) return t('error.requestTimeout', { seconds: match[1] });

    match = raw.match(/^网络请求失败[：:]\s*(.+)$/s);
    if (match) return t('error.network', { detail: match[1] });

    match = raw.match(/^(.+?)\s+未填写\s+Base URL$/);
    if (match) return t('error.missingBaseUrl', { provider: match[1] });

    match = raw.match(/^(.+?)\s+未填写模型名称$/);
    if (match) return t('error.missingModel', { provider: match[1] });

    match = raw.match(/^模型未返回文字内容[（(](.*)[）)]$/s);
    if (match) return t('error.emptyModelResponse', { reason: match[1] });

    match = raw.match(/^请先在设置中填写\s+(.+?)\s+API Key$/);
    if (match) return t('error.keyMissing', { provider: match[1] });

    match = raw.match(/^镜\s*(\d+)\s*的关键帧不可读取[：:]\s*(.+)$/s);
    if (match) {
      const source = match[2] === '未提供路径' ? t('error.framePathMissing') : match[2];
      return t('error.frameUnreadable', { shot: match[1], source });
    }

    return '';
  }

  function localizeError(message) {
    const raw = stripElectronErrorPrefix(message && typeof message === 'object' ? message.message || message : message);
    if (!raw) return '';
    const translated = knownError(raw);
    if (translated) return translated;
    return activeLocale === DEFAULT_LOCALE ? raw : t('error.unexpected', { detail: raw });
  }

  if (typeof document !== 'undefined') {
    document.documentElement.lang = activeLocale;
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => apply(document), { once: true });
    } else {
      apply(document);
    }
  }

  window.FeigeI18n = Object.freeze({
    t,
    getLocale,
    setLocale,
    apply,
    localizeRuntimeMessage,
    localizeError
  });
})();
