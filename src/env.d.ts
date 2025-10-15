/// <reference path="../.astro/types.d.ts" />

declare namespace App {
  interface Locals {
    user?: import("./types").User;
    livingLab?: import("./types").SessionLivingLabCookie;
  }
}
