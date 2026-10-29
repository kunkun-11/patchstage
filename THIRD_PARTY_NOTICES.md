# Sources and sample provenance

PatchStage's application, parser, and card renderer are independently written. Carbon, ray.so, diffreel, PatchStory, and Releaseframe are referenced as adjacent tools in `docs/RESEARCH.md`; their source is not copied into this application.

## Included Source Lab example

`public/samples/source-lab.diff` compares the deliberately incomplete emitter starter with the reference solution from [Tiny Source Lab](https://github.com/kunkun-11/tiny-source-lab), commit `10caa91edaed746ba2cf5177e162c4b679b91c9f`. The screenshots are crops of its deployed behavior-check panel, captured on 29 October 2026. Before shows the teaching starter's failed checks; after shows the reference answer's passing checks and guided status. They are real browser captures. They do not demonstrate a bug in mitt or an independently measured performance improvement.

Tiny Source Lab is MIT licensed, Copyright (c) 2026 kunkun-11. The emitter lesson is adapted from mitt v3.0.1, commit `b240473b5707857ba2c6a8e6d707c28d1e39da49`, and retains the following notice. The other production libraries and learning infrastructure are not runtime dependencies of PatchStage.

## mitt

MIT License

Copyright (c) 2021 Jason Miller

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
