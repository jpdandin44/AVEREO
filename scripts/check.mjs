#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "prototype-v1/index.html",
  "prototype-v1/styles.css",
  "prototype-v1/app.js",
  "prototype-v1/README.md",
  "avereo-v1-base/index.html",
  "avereo-v1-base/app.jsx",
  "avereo-v1-base/README.md",
  "avereo-v1-base/rendu-v1.html",
  "avereo-v1-base/standalone-v1.html",
  "avereo-v1-base/rendu-v1-static.html",
  "AVEREO_CONNECT_V1_Maquette_Fonctionnelle.md",
  "V2_Preparation_AVEREO.md",
  "NEXTCLOUD_INTEGRATION_V1.md",
  "scripts/prepare-pages.mjs",
  "scripts/create-v1-online-pr.ps1"
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("Missing required files:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

const prototypeHtml = fs.readFileSync(path.join(root, "prototype-v1/index.html"), "utf8");
const prototypeChecks = [
  { ok: prototypeHtml.includes("styles.css"), msg: "prototype-v1/index.html must reference styles.css" },
  { ok: prototypeHtml.includes("app.js"), msg: "prototype-v1/index.html must reference app.js" },
  { ok: prototypeHtml.includes("AVEREO"), msg: "prototype-v1/index.html should contain AVEREO branding" }
];

const pocHtml = fs.readFileSync(path.join(root, "avereo-v1-base/index.html"), "utf8");
const pocApp = fs.readFileSync(path.join(root, "avereo-v1-base/app.jsx"), "utf8");
const pocChecks = [
  { ok: pocHtml.includes("react.development.js"), msg: "avereo-v1-base/index.html must load React" },
  { ok: pocHtml.includes("zustand"), msg: "avereo-v1-base/index.html must load Zustand" },
  { ok: pocHtml.includes("app.jsx"), msg: "avereo-v1-base/index.html must reference app.jsx" },
  { ok: pocApp.includes("const { create } = window.zustand;"), msg: "avereo-v1-base/app.jsx must bind Zustand create" },
  { ok: pocApp.includes("ReactDOM.createRoot"), msg: "avereo-v1-base/app.jsx must bootstrap ReactDOM" },
  { ok: !pocApp.includes("export default"), msg: "avereo-v1-base/app.jsx must not contain export default" },
  { ok: pocApp.includes("const CLOUD_CONFIG_STORAGE_KEY"), msg: "avereo-v1-base/app.jsx should include cloud configuration storage" },
  { ok: pocApp.includes("const uploadToNextcloud"), msg: "avereo-v1-base/app.jsx should include Nextcloud upload support" },
  { ok: pocApp.includes("const Dashboard = () =>"), msg: "avereo-v1-base/app.jsx should include Dashboard component" },
  { ok: pocApp.includes("params.get('preview') === '1'"), msg: "avereo-v1-base/app.jsx should support preview mode" }
];

const pagesScript = fs.readFileSync(path.join(root, "scripts/prepare-pages.mjs"), "utf8");
const pagesChecks = [
  { ok: pagesScript.includes(".pages-dist"), msg: "scripts/prepare-pages.mjs should generate .pages-dist output" },
  { ok: pagesScript.includes("copyDir(path.join(root, \"avereo-v1-base\")"), msg: "scripts/prepare-pages.mjs should include V1 bundle" },
  { ok: pagesScript.includes("copyDir(path.join(root, \"prototype-v1\")"), msg: "scripts/prepare-pages.mjs should include prototype bundle" }
];

const failed = [...prototypeChecks, ...pocChecks, ...pagesChecks].filter((c) => !c.ok);
if (failed.length) {
  for (const c of failed) console.error(c.msg);
  process.exit(1);
}

console.log("Check passed: repository baseline is valid.");
