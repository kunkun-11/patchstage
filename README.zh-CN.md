# PatchStage · 更新展示工作台

**让别人一眼看懂这次改动。**

选择一段真实代码差异，配上你提供的前后截图和用途说明，做成一张发布卡片。在浏览器里编辑，导出与预览一致的 PNG，保存 JSON 后还能继续修改。

[在线体验](https://kunkun-11.github.io/patchstage/) · [English](README.md) · [贡献说明](CONTRIBUTING.md)

![真实课堂运行的前后对比与对应代码改动](public/samples/example-card.png)

## 怎么用

1. 粘贴 `git diff` 等统一差异输出，选择要展示的文件和片段。
2. 写明改了什么、对使用者有什么帮助，可选填仓库链接。
3. 上传实际截图，或选择只展示代码。
4. 选横版／方形、主题与颜色；导出 PNG、复制发布文案和图片描述，保存可编辑的 JSON 项目。

三种版式分别展示代码、截图或两者结合。原始行号保留，省略、隐藏上下文和超长代码会被标注。截图保持原始比例。

无需注册或 AI API Key，不执行输入代码。图片和差异在当前浏览器处理，不上传到图片服务。示例只读取站点自带的静态文件；没有统计采集或运行时 CDN。

## 示例是真实运行

内置卡片展示 [Tiny Source Lab](https://github.com/kunkun-11/tiny-source-lab) 事件课的课堂修复：初始代码中 A 取消自己，导致 B 被跳过；参考解答复制监听器列表后通过检查。截图来自实际浏览器，diff 对应这两份教学代码。

错误是课堂刻意设置的，mitt v3.0.1 原本已经正确处理。来源版本、许可和截图记录见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 本地运行与验证

需要 Node.js 20.19+ 或 22.12+。

```sh
git clone https://github.com/kunkun-11/patchstage.git
cd patchstage
npm ci
npm run dev
```

`npm run build` 生成 `dist/` 静态站点。浏览器会保存文字和设置；图片需要通过「保存项目」一起导出到 JSON。

```sh
npm test
npx playwright install chromium firefox
npm run test:browser
npm run build
```

支持最大 2 MB／30,000 行的标准 Git／统一差异，支持增删文件、多段改动、重命名、中文文件名和无末尾换行标记。合并差异需改为与一个父提交比较；二进制文件可列出，可用截图版式展示。图片支持 PNG、JPEG、WebP，每张最大 5 MB／4,000 万像素；项目文件最大 16 MB。

欢迎反馈可复现问题和贡献具体改进。选题依据见 [竞品调研](docs/RESEARCH.md)，[中英文发布素材](docs/LAUNCH.md) 已提供。觉得实用可以 star，方便以后再找到。

项目采用 MIT 许可；样例中改写的源码保留上游署名与许可。
