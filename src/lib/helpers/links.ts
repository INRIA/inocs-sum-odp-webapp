export function getUrl(path?: string) {
  if (path && path.startsWith("http")) {
    return path;
  }
  if (import.meta.env.BASE_URL === "/") {
    return path ?? "#";
  }
  return `${import.meta.env.BASE_URL}${path ?? "#"}`;
}
