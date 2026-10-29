# Launch one useful example

Repository title: **PatchStage — Show the change. Explain the payoff.**

First post title: **Why did listener B disappear? Show the fix with real screenshots and a diff.**

Chinese title: **让别人一眼看懂这次改动：真实截图 + 一段 diff。**

The first release has one complete story: use PatchStage to present Tiny Source Lab's event-emitter experiment. Show the actual starter and reference results, the selected teaching-code hunk, and the two repository links. The deliberately broken starter is a classroom example, not a defect in upstream mitt.

## Verify before using the drafts

1. Open the published demo in a fresh browser; load the example, export PNG, and inspect the complete image.
2. Export JSON, reopen it, and check that the selected hunk, text, screenshots, and card settings are preserved.
3. Verify that the example screenshots reproduce the stated Tiny Source Lab behavior and that the card's source link works.
4. Check the page and card at a phone viewport and with Chinese text. Use ALT describing the visible result, including any crop that changes its meaning.
5. Verify both repository links and the live URLs below. PatchStage Pages was deployed and its PNG/project exports verified on **29 October 2026**.

## Where the first post belongs

Rules were read on **29 October 2026**; the author should recheck them when posting. These are opportunities, not guaranteed placements.

| Destination | Current published rules relevant here | Practical use |
| --- | --- | --- |
| [HelloGitHub](https://hellogithub.com/) and its [Chinese submission form](https://github.com/521xueweihan/HelloGitHub/blob/master/.github/ISSUE_TEMPLATE/submit-cn.yaml) | Accepts GitHub-hosted open-source projects and self-recommendations. Requires category, a clear title, a 32–256-character description, and highlights; asks for original wording and a duplicate-recommendation check. [Review guidelines](https://github.com/521xueweihan/HelloGitHub/issues/271) consider documentation, license, activity, and competition. The repository's [contact configuration](https://github.com/521xueweihan/HelloGitHub/blob/master/.github/ISSUE_TEMPLATE/config.yml) also routes authors to website submission. | After the demos are verified, search each repository URL on the site. If absent, use its available submit route and tailor the description for each project. A crowded category or limited maintenance history may affect selection. |
| [Show HN](https://news.ycombinator.com/showhn.html) | Requires something users can try, personally worked on by an author who is around to discuss it. Says not to post quickly generated one-offs, landing pages, or request friends' upvotes/comments. | Consider it after the author has tried, refined, and can explain the implementation and tradeoffs. Having a generated working demo alone does not establish that fit. |
| An author's own social account or blog | This plan does not assume access or a platform's specific permissions. | Share one actual card plus the concise walkthrough below. Keep the example useful even to readers who do not visit GitHub. |
| [DEV](https://dev.to/terms) | Requires substantial, relevant content rather than primarily promotion/backlinks. Its [AI article rules](https://dev.to/guidelines-for-ai-assisted-articles-on-dev) explicitly disallow AI-assisted articles that promote a program or are mainly for personal-brand/clout growth. | These launch drafts are AI-assisted promotional material, so DEV is not the destination for them. A separately authored article would need to satisfy the current rules. |

No community submission or message is sent by this document. It prepares material for the author to adapt and post, then respond to actual feedback.

## English launch draft

**Title:** PatchStage: real before/after screenshots and a diff on one release card

Tiny Source Lab has a small emitter exercise: A removes itself while an event is being dispatched, and the intentionally broken starter skips B. Snapshotting the listener list preserves the current round. mitt already implements that behavior; the bug was introduced in the classroom variant.

I used that example for PatchStage, a browser workshop that puts the actual before/after captures next to a selected diff hunk and a short explanation. You can edit the title, benefit, and repository link, export the Canvas card as PNG, and keep an editable JSON project. It needs no account or AI API key.

This is a release-card workflow, with close neighbors such as Carbon, PatchStory, diffreel, and Releaseframe. It does not generate a real application screenshot from code. I'd like to hear whether this makes a small change easier to explain, and what would help you prepare your next release.

Try PatchStage: https://kunkun-11.github.io/patchstage/

Source: https://github.com/kunkun-11/patchstage

Try the lesson: https://kunkun-11.github.io/tiny-source-lab/#emitter

Lesson source: https://github.com/kunkun-11/tiny-source-lab

## 中文发布草稿

**标题：** 让别人一眼看懂这次改动：真实截图 + 一段 diff

Tiny Source Lab 里有一课：监听器 A 执行时取消自己，另一个 B 为什么被跳过了？修复方式是先复制本轮监听器列表。这里的错误是教学时故意设置的，mitt 原本就正确处理了这个行为。

我用这次实际课堂运行做了 PatchStage 的样例。把修复前后的真实截图放进浏览器，选一段 diff，再写上标题、用途和仓库地址，就能预览并导出 PNG。也可以保存 JSON，之后继续编辑。无需注册或配置 AI API Key。

Carbon、diffreel、PatchStory、Releaseframe 已覆盖代码图片、动画或发布卡的不同环节；这个项目专注于把一个具体改动讲清楚。截图由作者提供，不会凭 diff 自动编造界面。欢迎试一下，也欢迎告诉我：这样的卡片，是否能让你更快理解一次更新？

PatchStage 在线体验：https://kunkun-11.github.io/patchstage/

PatchStage 源码：https://github.com/kunkun-11/patchstage

动手试这门课：https://kunkun-11.github.io/tiny-source-lab/#emitter

Tiny Source Lab 源码：https://github.com/kunkun-11/tiny-source-lab

## HelloGitHub submission fields to adapt

Use category **JS**. Search the project URL before submitting; do not send the same description as two projects.

**PatchStage title:** 用真实截图和代码差异制作发布卡

**PatchStage description:** PatchStage 是一个浏览器发布卡编辑器。导入真实的前后截图与 unified diff，选择一段改动，加上标题、用途和仓库地址，预览后导出 PNG，并保留可继续编辑的 JSON。内置 Tiny Source Lab 教学修复样例，无需账号或 API Key。

**PatchStage highlights:** 一个卡片里连接实际结果、选定的代码改动与作者解释；预览和 PNG 使用同一 Canvas 绘制路径；课包样例有可运行来源。

**Tiny Source Lab title:** 在浏览器动手理解三个源码机制

**Tiny Source Lab description:** Tiny Source Lab 把事件派发、异步并发和状态选择器变成三个可直接动手的 JavaScript 实验。先预测结果，修改故意设置错误的教学实现，再运行行为检查、查看提示与固定来源。无需账号或 API Key，支持中英文说明。

**Tiny Source Lab highlights:** 检查实际行为，接受不同实现；区分独立完成与参考解答；明确上游版本及教学改写范围。PatchStage 的发布卡展示其中一次真实课堂修复。

## A finite first-week plan

- **Release day:** finish the two verified demos and releases; attach the actual PatchStage card to the first announcement.
- **Days 1–2:** the author tries the sample independently and adapts one relevant post. A HelloGitHub self-recommendation can use the verified submission form after checking for duplicates.
- **Days 2–4:** collect concrete feedback: what was difficult to import, whether the excerpt explains the result, and whether the recipient can reopen the JSON.
- **Days 4–7:** fix the most consequential problem and publish a substantive update. Review available GitHub traffic/referrals alongside questions and stars; do not infer product fit from stars alone.

No promised star quota or conversion rate is attached. If visits are low, improve the opening example and where it is shared. If visits occur but nobody uses the workflow, inspect its actual usefulness before creating more projects.

## 中文摘要

两个项目各自完整，同时用真实样例连接：源码实验台负责复现行为，PatchStage 负责讲清楚改动。发布前验证在线地址、PNG 和 JSON 往返，再由作者用当前规则提交或分享。HelloGitHub 有可用的自荐入口；Show HN 需要作者实际投入和讨论准备；这些 AI 辅助宣传稿不适合 DEV 的现行 AI 文章规则。收录、流量与 star 都存在不确定性。
