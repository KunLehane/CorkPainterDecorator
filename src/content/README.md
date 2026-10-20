# src/content

One JSON file per blog post or page. The build turns each file into a page using the
site's own header and footer, and rebuilds the blog index from every post.

```json
{
  "slug": "painting-a-hall-stairs-and-landing",
  "type": "post",
  "title": "Painting a Hall, Stairs and Landing in Cork",
  "seo_title": "Hall, Stairs and Landing Painting Cork",
  "meta_description": "Under 155 characters.",
  "date": "2026-10-12",
  "image": "/images/room-being-painted.webp",
  "image_alt": "Room being painted with dust sheets down",
  "excerpt": "One or two sentences for the blog index card.",
  "html": "<p>Body HTML using h2, h3, p, ul, li, strong, a.</p>"
}
```

- `type`: `post` (dated, listed on the blog index) or `page` (location or service page, not listed).
- `path`: optional URL override, e.g. `/painters-douglas/`. Defaults to `/<slug>/`.
- `draft: true` keeps a file out of the build.
- The build fails if a path already exists, so nothing live gets overwritten.
