# PatchStage: the workflow and its neighbors

Research snapshot: **29 October 2026**. The GitHub star counts below were read on this date and will change. README claims were inspected; competing products were not installed or benchmarked in this research.

PatchStage serves an author preparing a small release or explaining a change: select a real unified-diff hunk, supply actual before/after screenshots, write the benefit, and compose one shareable PNG. Keep the editable JSON when another version of the card is needed.

## Existing tools already cover much of this space

| Project | Stars at snapshot | What its README already provides | How PatchStage scopes the job |
| --- | ---: | --- | --- |
| [Carbon](https://github.com/carbon-app/carbon) | 36,122 | Styled code images, PNG/SVG export, sharing, ALT text through its Tweet button, and an offline PWA path. | A selected diff hunk is presented alongside two supplied screenshots and the author's release explanation. Offline operation and ALT text alone are not new. |
| [ray.so](https://github.com/raycast/ray-so) | 2,367 | Code images plus several Raycast-oriented tools, with public source and a local setup. | Focus on explaining one release result, rather than a broader collection of snippet tools. |
| [diffreel](https://github.com/99proteam/diffreel) | 0 | Animates code from two files, Git commits, or a steps JSON; has a browser playground and local MP4/GIF/WebM rendering. | A static card workshop with supplied screenshot evidence. “Diff to video” and editable JSON are already represented elsewhere. |
| [PatchStory](https://github.com/russ/patchstory) | 0 | Produces interactive PR walkthroughs from diffs or GitHub PRs, portable HTML/JSON, optional AI, and narrated presentation/video paths. | One compact visual card for sharing a selected change, rather than a complete review walkthrough. |
| [Releaseframe](https://github.com/codex-improvement-lab/releaseframe) | 0 | Turns two local PNG screenshots and declared numeric limits into a comparison card, ALT text, post draft, and review JSON through a local Node workflow. | Browser editing, a selected unified-diff hunk, and a portable editable project are our chosen emphasis. This is a close neighbor, not an empty market. |

The zero-star projects are early or small examples found during competition checks; they are not described as popular success stories. Neither a high count nor a low count determines the quality of an idea. The sample is selective and cannot establish demand for PatchStage.

## What this implementation adds

The combination is one authored release card containing a visible result, the relevant code change, and a short explanation with a repository link. The card preview and PNG export use the application's Canvas rendering path. The JSON project retains the editable inputs so an author can reopen them.

PatchStage's parser, card layout, browser interaction, import/export, and example preparation are independently written. The repositories above are references for product scope and existing alternatives; their source code and branding are not copied into PatchStage. Portability, local processing, and attractive code images are established techniques. We claim a particular workflow, not worldwide uniqueness or superiority.

## A real example from the companion project

[Tiny Source Lab](https://github.com/kunkun-11/tiny-source-lab) contains an event-emitter lesson in which the starter intentionally iterates a live listener list. Listener A removes itself during dispatch, and B can be skipped. The reference snapshots the list before iteration, so the first dispatch calls A and B while the next calls B.

PatchStage's example pairs captures of those actual classroom runs with the corresponding teaching-code diff. It explains the effect of the change rather than inventing a UI from a diff. This is **a repair to a deliberately broken teaching variant**, not a bug discovered in [mitt](https://github.com/developit/mitt/blob/3.0.1/src/index.ts). mitt already snapshots its listeners. Tiny Source Lab records its pinned source and license separately.

The two projects help different stages of the same task: the lab demonstrates the behavior; the card workshop makes that demonstration shareable. The example should link to both repositories so a reader can inspect the code and reproduce the lesson.

## Boundaries to keep visible

- Screenshots are supplied by the author. PatchStage does not infer or verify application behavior from code, nor authenticate that screenshots came from the same run.
- A selected hunk is a chosen excerpt, not a complete review of a commit or PR. Parser limits and unsupported diff forms should be described in the README.
- A layout preview can crop or shorten content. The author should inspect the exported card before sharing it.
- ALT and post drafts are editable descriptions of supplied material. They are not independent evidence of a claimed result.
- Editable project JSON may include the original supplied images and text. It should be treated as the original project, rather than assuming that it contains only the visible card crop.
- Processing can run locally once the application's assets are loaded or served locally. Initial access to a hosted site still requires those assets; no general offline-installation claim is implied.

## What would validate the choice

Start with a creator who already has screenshots and a small diff. Observe whether they can choose a meaningful hunk, describe the benefit, produce a readable card, and reopen the project without assistance. Ask which steps they normally perform in Carbon, a design editor, or a command-line renderer and whether this workshop removes any of them.

No time-savings benchmark, adoption experiment, or star-growth forecast has been performed. If the workflow adds little beyond the author's existing tools, improve or narrow it before expanding to video, automated capture, or AI narration.

## 中文摘要

Carbon 与 ray.so 证明代码图片是成熟形态；diffreel 已做代码动画，PatchStory 已做 PR 讲解，Releaseframe 已把真实截图、发布卡、ALT 与文案连接起来。PatchStage 的侧重点是浏览器里选择真实 diff 片段、配上作者提供的前后截图、编辑用途说明，并导出 PNG 和可继续编辑的 JSON。它是一个具体工作流，不宣称独创、性能领先或必涨 star。内置样例来自 Tiny Source Lab 的真实课堂运行，修复的是故意设置的教学错误，不是 mitt 的缺陷。
