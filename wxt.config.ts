import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "wxt";
// See https://wxt.dev/api/config.html
export default defineConfig({
  webExt: {
    disabled: false,
    // Popup automatisch in Tab öffnen während Development
    openDevtools: true,
  },
  modules: ["@wxt-dev/module-react"],
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./"),
      },
    },
  }),
  manifest: {
    name: "J2C",
    version: "5.0.0",
    description: "Jira Utilities",
    permissions: ["storage", "tabs", "scripting"],
    optional_host_permissions: ["https://*/*", "http://*/*"],
    // host_permissions: ["https://tickets.soptim.de/*"],
    // content_scripts: [
    //   {
    //     matches: ["https://tickets.soptim.de/*"],
    //     js: ["jira-inline.js"],
    //     run_at: "document_idle",
    //   },
    // ],
    icons: {
      "16": "icon/16.png",
      "32": "icon/32.png",
      "48": "icon/48.png",
      "96": "icon/96.png",
      "128": "icon/128.png",
    },
    action: {
      default_title: "J2C",
      default_icon: {
        "16": "icon/16.png",
        "32": "icon/32.png",
        "48": "icon/48.png",
        "96": "icon/96.png",
        "128": "icon/128.png",
      },
    },
  },
});
