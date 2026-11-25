# Android 离线安装包

安装包内含完整学习页面与 3000 道题，最低 Android 8.0，需要支持现代 JavaScript 的系统 WebView。包内没有网络权限。文件导入和导出使用系统文档选择器。

当前构建环境未安装 Android SDK。这里的 Python 构建脚本直接生成 Android 二进制清单、Dalvik 字节码，并用 OpenSSL 创建 v1 和 v2 签名。Python 3 与 OpenSSL 已就绪时，在本目录设置 WRITEFLOW_SIGNING_DIR 为安全的本地签名目录，再运行 python3 package.py。从 ../dist/WriteFlow.html 读取学习页面，输出 ../dist/WriteFlow-Android.apk。首次构建会创建签名身份，后续升级须沿用同一身份。请将私钥保存在发布文件之外。

执行 python3 verify.py ../dist/WriteFlow-Android.apk 可独立解析并验证最终文件的签名、内容摘要、清单、入口、代码结构及题库数量。此验证不包括安卓设备上的实际安装与交互。
