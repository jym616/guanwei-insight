# 观微 Insight 学习源码

这是“观微 Insight”用户评论与竞品洞察网页原型的完整源码。

## 它目前能做什么

- 展示总览、竞品监测、自家产品、评论分析、报告中心和数据源管理页面。
- 支持导航切换、弹窗、时间范围选择和操作提示。
- 支持电脑和手机宽度的响应式布局。

请注意：当前评论、指标和趋势是演示数据，尚未连接 Python 评论分析程序、DeepSeek 或真实数据库。

## Windows 运行方法

### 1. 安装 Node.js

建议安装 Node.js 22 或更新版本。安装完成后，重新打开 VS Code。

### 2. 用 VS Code 打开本文件夹

不要只打开某一个文件，应选择“文件 → 打开文件夹”。

### 3. 安装项目依赖

在 VS Code 终端输入：

```powershell
npm install
```

第一次安装可能需要几分钟。

### 4. 启动观微

最简单的方法是在 PowerShell 中运行：

```powershell
.\启动观微.ps1
```

终端会显示一个本地网址，通常类似：

```text
http://localhost:3000
```

按住 Ctrl 点击网址，即可在浏览器打开。

### 5. 停止运行

回到终端，按：

```text
Ctrl + C
```

## 最值得先看的文件

- `app/page.tsx`：页面内容、演示数据和按钮逻辑。
- `app/globals.css`：颜色、大小、布局和手机适配。
- `app/layout.tsx`：网页标题和说明。
- `package.json`：项目使用的工具和版本。
- `worker/index.ts`：云端运行入口，初学阶段不用修改。

## 建议的学习顺序

1. 在 `app/page.tsx` 中修改“早上好，林小满”。
2. 修改 `reviews` 中的一条演示评论。
3. 在 `app/globals.css` 中修改绿色主题颜色。
4. 尝试增加一个导航菜单。
5. 最后再尝试连接 Python 生成的 JSON 数据。

## 安全提醒

- 不要把 DeepSeek API Key 写入这个项目。
- 不要把 `.env` 文件上传到 GitHub。
- `node_modules`、`dist` 和本地临时文件不需要上传。

