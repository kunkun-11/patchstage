# Contributing

Useful changes make a real release easier to explain: improve a parser edge case, a readable card layout, an image/project import bug, or a clear bilingual label.

Run `npm ci`, `npm test`, `npm run test:browser`, and `npm run build`. Install test browsers with `npx playwright install chromium firefox` when needed.

Parser changes should include a real or minimal unified diff and expected old/new line numbers. The parser only reads patches; it does not apply or execute them. Preserve significant source whitespace and distinguish binary/combined metadata explicitly.

Layout changes should use the same canvas for preview and PNG. Verify a short and long hunk, English and Chinese text, square and landscape layouts, and long filenames. Mark omitted rows and clipped code on the exported card. Use actual user-supplied images and preserve their proportions. Imported projects must not overwrite edits made while loading.

Keep inputs local and avoid runtime CDN or service requirements for basic authoring. If a new export or template needs a broader design decision, describe the user task in an issue first. Submit a focused PR with before/after images, test results, and any source attribution.

中文：欢迎贡献解析边界、卡片可读性、导入问题和中英文讲解。变更应提供可复现输入，保留正确行号和省略提示，验证图片、JSON 和两种尺寸。预览与 PNG 必须保持一致。
