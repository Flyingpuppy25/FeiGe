# FeiGe

本地优先的 Windows / macOS AI 视频拆片、分镜识别与剧本导出工作台。

Local-first Windows and macOS workbench for AI video breakdown, storyboard analysis,
script generation, and production-ready exports.

FeiGe 是独立实现的开源软件，不包含其他商业软件的源码、授权绕过代码或品牌素材。

## 下载 / Download

从项目的 GitHub Releases 下载与电脑匹配的压缩包：

- Windows 64 位：`FeiGe-0.4.2-Windows-绿色版.zip`
- Apple 芯片（M1/M2/M3/M4/M5）：`FeiGe-0.4.2-macOS-arm64.zip`
- Intel Mac：`FeiGe-0.4.2-macOS-x64.zip`

全部版本均无需安装。Windows 解压后运行 `FeiGe.exe`；macOS 解压后运行
`FeiGe.app`。macOS 版本支持 macOS 12 及以上，首次打开方式见
[`docs/macOS使用说明.txt`](docs/macOS使用说明.txt)。

Download the ZIP matching your computer from GitHub Releases. All builds are
portable: run `FeiGe.exe` on Windows or `FeiGe.app` on macOS 12+. Apple Silicon
uses `arm64`; Intel Macs use `x64`.

## 主要功能 / Highlights

- 四检测器混合拆镜：硬切、白闪、渐隐渐现和叠化融合，默认启用
- 可切换经典帧差模式；最小切点间隔、最大6000镜、AI并发数可调
- 差异曲线定位与右键加切点，镜头支持编辑、删除和单镜重新识别
- 识别期间锁定危险操作；删除镜头后自动重排镜号与时间区间
- 剧本场景支持编辑、插入和删除，也可进行全文编辑
- 每次AI生成保存独立版本，并记录接口、模型和生成时间；支持切换和删除
- OpenAI、Claude及OpenAI兼容接口使用最多24张均匀时间戳关键帧生成剧本
- Gemini优先使用压缩视频理解，失败时回退到均匀时间戳关键帧
- 429、5xx、网络错误和超时采用最多4次指数退避重试
- 导出嵌图Excel分镜表、Word剧本、自包含HTML页面和分享ZIP
- 中文与English界面即时切换
- API Key由用户在本机填写，并使用系统安全存储能力保护
- 设置页提供一个统一的 API 连接测试按钮，一次检查全部已完整配置的接口
- 项目与风格研究条目均提供三点菜单：重命名、在文件夹中打开、永久删除
- 风格研究按“准备 → 分镜拆解 → 构建拼图 → AI 提炼”四阶段执行并显示进度

English summary:

- Default hybrid cut detection fusing hard cuts, white flashes, fades, and dissolves
- Optional classic frame-difference mode with adjustable cut interval, 6,000-shot cap, and AI concurrency
- Editable/deletable shots, per-shot reanalysis, interactive difference curve, and manual cuts
- Scene-level script editing plus version history with provider/model metadata
- Up to 24 uniformly sampled timestamped frames for OpenAI, Claude, and OpenAI-compatible APIs
- Compressed video understanding for Gemini with timestamped-frame fallback
- Four-attempt exponential backoff for rate limits, server errors, network failures, and timeouts
- Excel, Word, standalone HTML, and shareable ZIP exports
- Instant Chinese/English interface switching

## 使用 / Usage

1. 新建项目并选择本地视频。
2. 在设置中选择模型接口，填写Base URL、模型名和API Key。
3. 使用默认“混合检测”自动拆镜，或切换到“经典帧差检测”。
4. 自动或手动识别镜头；可编辑、删除或重新识别单个镜头。
5. 生成剧本，在版本栏中比较不同API或模型的结果。
6. 导出Word、Excel、HTML，或一次生成完整分享包。

Windows 项目数据保存在绿色版旁边的 `FeiGeData`；macOS 项目数据保存在
`~/Library/Application Support/FeiGe`。API Key 仅保存在本机，不会写入导出的
项目 ZIP。

## 支持的接口 / Model APIs

内置OpenAI、Claude、Gemini、DeepSeek和通义千问预设，也可添加任意
OpenAI兼容地址。模型名称可以自由修改；图片、视频和结构化输出能力取决于
具体模型及服务商。

Built-in presets cover OpenAI, Claude, Gemini, DeepSeek, and Qwen. Additional
OpenAI-compatible endpoints can be added locally. Media and structured-output
support depend on the selected model and provider.

## 开发 / Development

```text
npm install
npm run setup:ffmpeg
npm start
npm test
```

打包Windows运行目录：

```text
npm run pack
```

Application code is in `src/`. The green package already includes the Windows
x64 LGPL shared FFmpeg runtime. Source checkouts intentionally omit those large
binaries; run `npm run setup:ffmpeg` once before local development or packaging.

macOS 包必须在对应架构的 Mac 上构建。仓库已提供 GitHub Actions 工作流，分别
使用 Intel 与 Apple 芯片构建机生成两个 ZIP；操作说明见
[`docs/构建macOS.md`](docs/构建macOS.md)。在 Mac 本机也可运行：

```text
npm ci
npm test
npm run dist:mac
```

## 安全 / Security

不要提交或分享 `settings.json`、`FeiGeData`、API Key、私人视频或项目输出。
已经公开的密钥应立即在服务商后台撤销并重新生成。See [SECURITY.md](SECURITY.md).

## License

FeiGe source code is licensed under [Apache-2.0](LICENSE). Bundled third-party
components retain their own licenses; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
and `vendor/FFMPEG-LGPL-3.0.txt`.
