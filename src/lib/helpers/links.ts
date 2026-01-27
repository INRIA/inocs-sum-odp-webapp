export function getUrl(path?: string) {
  if (path && path.startsWith("http")) {
    return path;
  }
  const baseURl = process.env.BASE_URL ?? import.meta.env.BASE_URL ?? "";
  if (baseURl === "/") {
    return path ?? "#";
  }
  return `${baseURl}${path ?? "#"}`;
}
