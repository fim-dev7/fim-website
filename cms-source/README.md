# Content Doc starter files

These 4 HTML files mirror the existing hand-built episode pages, restructured
under the H1 sections the Drive-as-CMS sync expects.

## How to use each one

1. Open the file in your browser (double-click in Finder, or open from VS Code preview).
2. **Cmd + A** to select all rendered content.
3. **Cmd + C** to copy.
4. Open https://drive.google.com and navigate into your **Episode Content** folder.
5. **New → Google Doc**.
6. Name it exactly: `Ep 28 - Shakeel Lala` (and 26, 25, 20 the same way).
7. **Cmd + V** to paste. Google Docs will preserve all the H1 headings, bullet lists,
   blockquotes, and bold formatting.
8. Save (Google Docs auto-saves).

Once all 4 docs are in the folder and `episode_content_folder_id` is set in your
Settings sheet, the next sync will regenerate the corresponding episode pages
identically to the current ones — and from then on, you edit the Docs to update
the pages.

## What's where

| File | Becomes | URL |
|---|---|---|
| `ep-28-shakeel-lala.html` | `Ep 28 - Shakeel Lala` doc | /episodes/28-shakeel-lala/ |
| `ep-26-celeste-amadon.html` | `Ep 26 - Celeste Amadon` doc | /episodes/26-celeste-amadon/ |
| `ep-25-nam-nguyen.html` | `Ep 25 - Nam Nguyen` doc | /episodes/25-nam-nguyen/ |
| `ep-20-andy-miller.html` | `Ep 20 - Andy Miller` doc | /episodes/20-andy-miller/ |

These source files are excluded from the Vercel deploy via `.vercelignore` —
they live in the repo as the canonical reference, but never get served.
