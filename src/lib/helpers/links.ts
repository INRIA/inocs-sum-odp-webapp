export function getUrl(path?: string) {
  if (path && path.startsWith("http")) {
    return path;
  }
  if (import.meta.env.BASE_URL === "/") {
    return path ?? "#";
  }
  return `${import.meta.env.BASE_URL}${path ?? "#"}`;
}

export function getUrlForAdminHost(path?: string) {
  const adminHost = import.meta.env.ODP_ADMIN_APP_HOST;
  return `${adminHost}${path ?? ""}`;
}
