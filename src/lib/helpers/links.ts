export function getUrl(path?: string) {
  if (path && path.startsWith("http")) {
    return path;
  }
  const baseURl = import.meta.env.BASE_URL ?? process.env.BASE_URL ?? "";
  if (baseURl === "/") {
    return path ?? "#";
  }
  return `${baseURl}${path ?? "#"}`;
}
