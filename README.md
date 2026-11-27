# VerbaStep

面向初高中学习者的离线英语专项训练软件，内置原有 3000 道训练题，知识学习中心另有 725 道配套题。选择单词、语法、句子、阅读、完形或中译英专项，自定难度和题量。每题提交后均可查看中文解析；错题可以单独复习。写作区提供自由写作、命题作文和历史版本。

## 下载 3.1.1

[VerbaStep-3.1.1-Android.apk](https://github.com/killsiwk1/WriteFlow/raw/refs/heads/main/downloads/v3.1.1/VerbaStep-3.1.1-Android.apk)

[VerbaStep-3.1.1-Windows-Setup.exe](https://github.com/killsiwk1/WriteFlow/raw/refs/heads/main/downloads/v3.1.1/VerbaStep-3.1.1-Windows-Setup.exe)

[VerbaStep-3.1.1-macOS.pkg](https://github.com/killsiwk1/WriteFlow/raw/refs/heads/main/downloads/v3.1.1/VerbaStep-3.1.1-macOS.pkg)

[VerbaStep-3.1.1-source.zip](https://github.com/killsiwk1/WriteFlow/raw/refs/heads/main/downloads/v3.1.1/VerbaStep-3.1.1-source.zip)

[历史版本 3.0.3](downloads/v3.0.3)

## 下载使用

[下载离线网页版](https://github.com/killsiwk1/WriteFlow/raw/refs/heads/main/dist/WriteFlow.html)。将 HTML 保存到电脑，用现代浏览器打开即可开始练习。请使用同一浏览器和固定的文件位置，并定期在设置里备份。GitHub 文件预览只能查看源码。

## 知识学习中心

打开随源码附带的 `dist/WriteFlow.html`，进入「知识学习」。可以按中文、英文或动词变化形式查找课程，也可以从某道错题返回相关讲解。课程收藏、阅读状态和答题结果保存在本机。更换网页文件位置或浏览器前，请先在设置中导出备份，再在新位置导入。

### 3.1.1 桌面与移动安装

Windows x64 安装向导提供目录选择，在桌面和开始菜单创建快捷方式。运行独立窗口需要 Edge 或 Chrome。macOS 使用通用 PKG，支持 macOS 13 或更高版本的 Intel 与 Apple 芯片电脑。Android 包使用历次版本的同一签名，支持 Android 8.0 起的设备，需要支持现代 JavaScript 的系统 WebView。三端均包含原有 3000 题、725 道知识练习和 218 课。

## 个人云同步（开发版）

默认使用本地存储。可选的同步功能使用学习者自己的 Supabase 项目。模拟设备之间的同步测试已通过，真实注册、数据库隔离和跨平台真机互传尚待验证。此前的 3.0.3 原生安装包仅包含离线功能。

[配置步骤与验收记录](supabase/使用与验收.md)

## 从源码运行

在项目根目录执行以下命令，用 Python 3 生成离线页面，再用支持 Web Storage 的新版 Node.js 执行测试。

```sh
python3 tools/bundle.py
node tests/core.cjs
node tests/workflows.cjs
node tests/sync.cjs
```

共享界面与题库在 web，内容构建工具在 tools。Windows、macOS 和 Android 容器在 platforms。Android 的另一套构建与签名流程见 [Android 构建说明](android-build/README.md)。签名材料需在本机单独配置。

## 许可证

VerbaStep 项目原创部分使用 GNU General Public License version 3（GPL-3.0-only）。[完整协议](LICENSE)。内置第三方组件 pako 保留其[原许可证](web/vendor/pako-LICENSE.txt)。
