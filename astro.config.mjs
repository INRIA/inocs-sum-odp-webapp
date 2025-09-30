// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: "server", // Changed from "static" to enable SSR and API routes
  adapter: node({
    mode: "standalone",
  }),
  vite: {
    plugins: [tailwindcss()],
    ssr: {
      noExternal: ["@material-tailwind/react"],
    },
    optimizeDeps: {
      include: ["@material-tailwind/react"],
    },
  },
  //TEMP config for static demo with Github pages (commented out for SSR)
  // site: "https://inria.github.io",
  // base: "/inocs-sum-odp-frontend",
  build: { assets: "assets" }, // replaces the default "_astro"
});
