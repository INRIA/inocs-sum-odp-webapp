/// <reference path="../.astro/types.d.ts" />

declare module "*.astro" {
  const AstroComponent: unknown;
  export default AstroComponent;
}

declare namespace App {
  interface Locals {
    user?: import("./types").User;
    livingLab?: import("./types").SessionLivingLabCookie;
    odpAdminHost?: string;
  }
}
