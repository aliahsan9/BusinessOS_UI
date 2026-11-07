# Adding a BusinessOS Insights article

Insights articles are static files. The Angular components do not contain article text, and there is no CMS, database table, or API to update.

## Add the seventh article

1. Pick a slug: lowercase letters, numbers, and single hyphens, for example `warehouse-slotting`.
2. Create `public/assets/blog/warehouse-slotting/`.
3. Add `article.md` in that folder. Start it with front matter:

```yaml
---
title: Warehouse Slotting for Growing Stores
slug: warehouse-slotting
description: One sentence used for search results, the article subtitle, and the meta description.
category: Inventory & Operations
author: BusinessOS
publicationDate: 2026-11-07
updatedDate: 2026-11-07
featuredImage: assets/blog/warehouse-slotting/cover.svg
featuredImageAlt: Describe the image for someone who cannot see it.
tags:
  - inventory
  - warehouse
featured: false
---
```

4. Write the article in Markdown under the front matter. The page already renders the title as the only `h1`, so start sections at `h2` (`##`).
5. Put images beside `article.md` and refer to them as `assets/blog/warehouse-slotting/diagram.svg`. Alt text goes in the Markdown image.
6. Add the slug to the `articles` array in `public/assets/blog/index.json`.

Reload `/insights`. The list, search, category filters, reading time, table of contents, and article route all pick up the file. Reading time is calculated from the body at about 200 words per minute. Set `readingTime` in the front matter only when you want to override that calculation.

You do not need to edit a component, a service, or a route.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| title | yes | Article heading and document title |
| slug | yes | Must match the folder name and the index entry |
| description | yes | Listing card, subtitle, and meta description |
| category | yes | One of the existing categories below |
| author | yes | Shown on the article |
| publicationDate | yes | `YYYY-MM-DD`. Newest dates are listed first |
| updatedDate | no | Defaults to the publication date |
| featuredImage | yes | Path under `assets/blog/...` |
| featuredImageAlt | no | Defaults to the title |
| tags | yes | Used by search |
| featured | no | `true` promotes the newest featured article |
| readingTime | no | Positive whole number of minutes. Omit it to calculate |

Categories already supported:

- AI & Automation
- Business Management
- SaaS Architecture
- Inventory & Operations
- Data & Analytics
- Security

A new category also needs to be added to `INSIGHT_CATEGORIES` in `src/app/features/insights/models/article.model.ts`. A new article in an existing category does not.

## Routes

- `/insights` lists articles.
- `/insights/warehouse-slotting` renders that folder's `article.md`.

Markdown is rendered with `ngx-markdown`, the same library as the portfolio, plus Prism for highlighted code blocks and the Prism copy button. Article typography lives in `src/styles/_insights-markdown.scss` and applies to every article.
