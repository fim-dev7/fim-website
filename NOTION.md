# Notion → Site sync

The site reads episodes from `episodes.json` at runtime. Your job is to keep that file in sync with your Notion database.

## Notion database schema

Set up a single database in Notion with these properties:

| Notion property | Type            | Used as              | Required |
|-----------------|-----------------|----------------------|----------|
| `Episode #`     | Number / Formula| `n`                  | yes      |
| `Title`         | Title           | `title`              | yes      |
| `Guest`         | Text            | `guest`              | yes      |
| `Role`          | Text            | `role` (e.g. "Co-founder, Lantern") | yes |
| `Date`          | Date            | `date`               | yes      |
| `Tag`           | Select          | `tag` (Build / Funding / Team / Craft) | yes |
| `Duration`      | Text            | `dur` (e.g. `1:08:42`) | yes    |
| `Spotify URL`   | URL             | platform deep-link   | optional |
| `Apple URL`     | URL             | platform deep-link   | optional |
| `YouTube URL`   | URL             | platform deep-link   | optional |
| `Audio file`    | File            | source for the in-page player | optional |
| `Show notes`    | Rich text       | episode page         | optional |
| `Transcript`    | File or rich text | episode page       | optional |
| `Cover`         | Files & media   | episode artwork      | optional |
| `Featured?`     | Checkbox        | "Latest episode" card | one row should be true |
| `Published?`    | Checkbox        | gate before showing  | yes — only `true` rows are pulled |

## `episodes.json` shape

```json
{
  "_meta": {
    "source": "notion",
    "database_id": "...",
    "synced_at": "2026-05-17T06:00:00Z"
  },
  "episodes": [
    { "n": "042", "title": "...", "guest": "...", "role": "...",
      "date": "May 14, 2026", "tag": "Build", "dur": "1:08:42",
      "featured": true,
      "spotify": "https://...", "apple": "https://...", "youtube": "https://..." }
  ]
}
```

## Three sync options

### 1. Manual export (free, ~2 min per episode)

In Notion: `••• → Export → Markdown & CSV`. Run a tiny script (or hand-edit) to convert the CSV into the JSON shape above, then commit.

### 2. Hosted service (~$15–30/mo, zero code)

- **Feather** (`feather.so`) — Notion → JSON API, very podcast-friendly.
- **Potion** (`potion.so`) — similar.
- **Super** (`super.so`) — full-site replacement, but exposes a JSON feed.

Set the site to fetch their endpoint instead of the local file:
```js
fetch("https://api.feather.so/v1/databases/<id>")
```

### 3. Roll your own (free, ~1 hr setup)

Use the official Notion API. The cleanest pattern:

- Create a Notion integration → grab the secret token.
- Add a **GitHub Action** that runs on a schedule (every 30 min) or via a `repository_dispatch` webhook from a Notion automation:
  ```yaml
  on:
    schedule: [{ cron: "*/30 * * * *" }]
    workflow_dispatch:
  jobs:
    sync:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - run: node scripts/sync-notion.js
          env:
            NOTION_TOKEN: ${{ secrets.NOTION_TOKEN }}
            NOTION_DB_ID: ${{ secrets.NOTION_DB_ID }}
        - uses: stefanzweifel/git-auto-commit-action@v5
          with: { commit_message: "chore: sync episodes from notion" }
  ```
- `scripts/sync-notion.js` queries the database, maps fields → JSON, writes `episodes.json`.

A minimal mapper (Node):

```js
import { Client } from "@notionhq/client";
import fs from "fs";

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const res = await notion.databases.query({
  database_id: process.env.NOTION_DB_ID,
  filter: { property: "Published?", checkbox: { equals: true } },
  sorts: [{ property: "Date", direction: "descending" }],
});

const ep = (p) => ({
  n: String(p.properties["Episode #"].number).padStart(3, "0"),
  title: p.properties["Title"].title[0]?.plain_text ?? "",
  guest: p.properties["Guest"].rich_text[0]?.plain_text ?? "",
  role: p.properties["Role"].rich_text[0]?.plain_text ?? "",
  date: new Date(p.properties["Date"].date.start).toLocaleDateString("en-US",
    { month: "short", day: "numeric", year: "numeric" }),
  tag: p.properties["Tag"].select?.name ?? "",
  dur: p.properties["Duration"].rich_text[0]?.plain_text ?? "",
  featured: p.properties["Featured?"].checkbox,
  spotify: p.properties["Spotify URL"].url ?? null,
  apple: p.properties["Apple URL"].url ?? null,
  youtube: p.properties["YouTube URL"].url ?? null,
});

fs.writeFileSync("episodes.json", JSON.stringify({
  _meta: {
    source: "notion",
    database_id: process.env.NOTION_DB_ID,
    synced_at: new Date().toISOString(),
  },
  episodes: res.results.map(ep),
}, null, 2));
```

## What the site does with it

- `Episodes` section fetches `episodes.json` on load, falls back to baked-in seeds if the fetch fails.
- A small "Synced from Notion · {timestamp}" indicator at the bottom of the archive uses `_meta.synced_at`.
- The featured-card on the homepage will use the row where `featured: true` (currently still hard-coded — let me know when you want that swapped over).
