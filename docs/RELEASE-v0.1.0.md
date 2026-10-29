# PatchStage v0.1.0

**Show the change. Explain the payoff.**

[Open the workshop](https://kunkun-11.github.io/patchstage/)

Build a release card from one real unified-diff hunk, your actual before/after screenshots, and an authored benefit. Includes code, screenshot-comparison, and story layouts; landscape/square PNG; English/Chinese controls; themes; exact source line numbers; omission notes; and image-preserving editable JSON projects.

PNG exports the same canvas you preview. The included sample comes from Tiny Source Lab's actual starter/reference runs. Source and adaptations are attributed, and the card identifies its code excerpt. Inputs are processed locally; an account or API key is not needed.

Validation:

- 30 Node tests pass, covering diff parsing, project validation, and accurate draft/ALT content.
- Browser tests exercise actual PNG pixels/dimensions, JSON/image roundtrips, bad imports, incomplete links, slow-load edit preservation, and mobile/Chinese behavior. GitHub Actions passed its Chromium, Firefox, and mobile projects.
- Production build and Pages deployment pass. Public export produces 1600×1000 PNG and version 1 JSON containing both images and selected hunk, with no page errors.

中文：把真实截图、选定代码片段和用途说明做成一张可编辑的发布卡片。导出与预览一致的 PNG，保存含图片的 JSON，中英文界面与三种版式完整。样例来自真实课堂运行；错误是教学设置，不是上游缺陷。
