# WriteFlow

面向初高中学习者的离线英语专项训练软件，内置 3000 道题。选择单词、语法、句子、阅读、完形或中译英专项，自定难度和题量。每题提交后均可查看中文解析；错题可以单独复习。写作区提供自由写作、命题作文和历史版本。

## 下载使用

[下载离线网页版](https://github.com/killsiwk1/WriteFlow/raw/refs/heads/main/dist/WriteFlow.html)。将 HTML 保存到电脑，用现代浏览器打开即可开始练习。请使用同一浏览器和固定的文件位置，并定期在设置里备份。GitHub 文件预览只能查看源码。

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

WriteFlow 项目原创部分使用 GNU General Public License version 3（GPL-3.0-only）。[完整协议](LICENSE)。内置第三方组件 pako 保留其[原许可证](web/vendor/pako-LICENSE.txt)。
