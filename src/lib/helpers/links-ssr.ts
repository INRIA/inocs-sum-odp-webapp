export function getUrlForAdminHost(context: App.Locals, path?: string) {
  const adminHost = context.odpAdminHost ?? "";
  return `${adminHost}${path ?? ""}`;
}
