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

export function getUrlForAdminHost(path?: string) {
  const adminHost =
    process.env.ODP_ADMIN_HOST_PUBLIC ??
    import.meta.env.ODP_ADMIN_HOST_PUBLIC ??
    "";
  return `${adminHost}${path ?? ""}`;
}
