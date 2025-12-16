export function normalizeUrl(link, baseUrl) {
  if (!link) return null;

  try {
    if (link.startsWith("http")) return link;
    if (link.startsWith("/")) {
      return new URL(link, baseUrl).href;
    }
    return null;
  } catch {
    return null;
  }
}
