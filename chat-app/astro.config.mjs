// @ts-check
import { defineConfig } from "astro/config";

import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  output: "server",

  vite: {
      plugins: [tailwindcss()],
      ssr: {
          noExternal: ["streamdown"],
      },
	},

  adapter: netlify(),
});