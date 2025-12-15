export function leanListPost(p) {
  if (!p) return p
  return {
    id: p.id ?? null,
    title: p.title ?? null,
    slug: p.slug ?? null,
    prefix: p.prefix ?? null,
    href: p.href ?? null,
    category: p.category ?? null,
    summary: p.summary ?? null,
    publishDate: p.publishDate ?? null,
    publishDay: p.publishDay ?? null,
    lastEditedDay: p.lastEditedDay ?? null,
    pageCoverThumbnail: p.pageCoverThumbnail ?? null,
    pageIcon: p.pageIcon ?? null,
    tagItems: p.tagItems ?? [],
    results: p.results ?? null
  }
}
