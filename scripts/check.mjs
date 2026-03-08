#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  "prototype-v1/index.html",
  "prototype-v1/styles.css",
  "prototype-v1/app.js",
  "prototype-v1/README.md",
  "AVEREO_CONNECT_V1_Maquette_Fonctionnelle.md"
];

const missing = requiredFiles.filter((file) => !fs.existsSync(path.join(root, file)));
if (missing.length) {
  console.error("Missing required files:");
  for (const file of missing) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

const html = fs.readFileSync(path.join(root, "prototype-v1/index.html"), "utf8");
const checks = [
  { ok: html.includes("styles.css"), msg: "index.html must reference styles.css" },
  { ok: html.includes("app.js"), msg: "index.html must reference app.js" },
  { ok: html.includes("AVEREO"), msg: "index.html should contain AVEREO branding" }
];

const failed = checks.filter((c) => !c.ok);
if (failed.length) {
  for (const c of failed) console.error(c.msg);
  process.exit(1);
}

console.log("Check passed: repository baseline is valid.");
