# 构建 FeiGe macOS 绿色版

仓库中的 `.github/workflows/build-macos.yml` 会分别在原生 Intel 与 Apple 芯片
macOS 构建机上生成两个独立压缩包，不需要在 Windows 电脑上安装 macOS 环境。

## 在 GitHub 手动构建

1. 把完整源码上传到 GitHub 仓库，确认 `.github/workflows/build-macos.yml` 已存在。
2. 打开仓库的 **Actions** 页面，选择 **Build macOS portable packages**。
3. 点击 **Run workflow**，选择主分支并确认运行。
4. 两项任务都变成绿色后，在本次运行页面底部下载：
   - `FeiGe-macOS-arm64`
   - `FeiGe-macOS-x64`
5. 每个 Actions 下载包中包含正式绿色版 ZIP 与对应 SHA-256 文件。

工作流只生成构建产物，不会自动发布 Release。完成真实 Mac 验收后，再把两个
`FeiGe-0.4.2-macOS-*.zip` 与 SHA-256 文件上传到 GitHub Release。

## 在 Mac 本机构建

需要 Node.js 22、Xcode Command Line Tools，以及下载 FFmpeg 官方源代码的网络连接：

```text
npm ci
npm test
npm run dist:mac
```

输出位于 `release-mac`。在 Intel Mac 上生成 x64 包，在 Apple 芯片 Mac 上生成
arm64 包；不建议在一台机器上交叉生成另一个架构。
