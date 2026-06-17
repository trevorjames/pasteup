export async function searchNYPL(query: string, page = 1, perPage = 20) {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    per_page: String(perPage),
  })
  const res = await fetch(`/api/nypl/search?${params}`)
  if (!res.ok) throw new Error('NYPL search failed')
  const data = await res.json()
  return {
    images: data.images ?? [],
    totalCount: data.totalCount ?? 0,
    page: data.page ?? 1,
  }
}