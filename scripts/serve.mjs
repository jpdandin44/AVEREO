#!/usr/bin/env node
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");

const baseDirArg = process.argv[2] || "prototype-v1";
const portArg = Number(process.argv[3] || 5173);
const baseDir = path.resolve(root, baseDirArg);

if (!fs.existsSync(baseDir)) {
  console.error(`Directory not found: ${baseDir}`);
  process.exit(1);
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const server = http.createServer((req, res) => {
  const rawPath = req.url?.split("?")[0] || "/";
  const safePath = rawPath === "/" ? "/index.html" : rawPath;
  const target = path.normalize(path.join(baseDir, safePath));

  if (!target.startsWith(baseDir)) {
    res.statusCode = 403;
    res.end("Forbidden");
    return;
  }

  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  const ext = path.extname(target).toLowerCase();
  res.setHeader("Content-Type", mime[ext] || "application/octet-stream");
  fs.createReadStream(target).pipe(res);
});

server.listen(portArg, () => {
  console.log(`Serving ${baseDirArg} on http://localhost:${portArg}`);
});
