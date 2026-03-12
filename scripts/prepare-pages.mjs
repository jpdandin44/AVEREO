#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const outDir = path.join(root, ".pages-dist");

const copyDir = (source, destination) => {
  if (!fs.existsSync(source)) {
    throw new Error(`Source directory not found: ${source}`);
  }
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(source, destination, { recursive: true });
};

const cleanOutDir = () => {
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(outDir, { recursive: true });
};

const writeLandingPage = () => {
  const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AVEREO CONNECT - Preview Online</title>
    <style>
      :root {
        --bg: #eef2ff;
        --ink: #0f172a;
        --muted: #475569;
        --line: #dbe2f0;
        --card: #ffffff;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "Segoe UI", Tahoma, sans-serif;
        color: var(--ink);
        background:
          radial-gradient(1100px 500px at 10% -10%, #c7d2fe 0%, transparent 70%),
          radial-gradient(900px 500px at 100% 0%, #bfdbfe 0%, transparent 60%),
          var(--bg);
      }
      .wrap { max-width: 980px; margin: 0 auto; padding: 24px 16px 40px; }
      .hero {
        border-radius: 18px;
        padding: 20px;
        color: #fff;
        background: linear-gradient(120deg, #1e1b4b, #312e81 55%, #0f766e);
      }
      .hero h1 { margin: 0 0 8px; }
      .hero p { margin: 0; opacity: 0.92; }
      .grid {
        margin-top: 14px;
        display: grid;
        grid-template-columns: 1fr;
        gap: 12px;
      }
      .card {
        background: var(--card);
        border: 1px solid var(--line);
        border-radius: 14px;
        padding: 14px;
      }
      .card h2 { margin: 0 0 6px; font-size: 17px; }
      .card p { margin: 0 0 10px; color: var(--muted); }
      a.btn {
        display: inline-block;
        text-decoration: none;
        border: 1px solid #cbd5e1;
        border-radius: 10px;
        padding: 8px 10px;
        margin-right: 8px;
        margin-bottom: 8px;
        color: #0f172a;
        background: #f8fafc;
        font-weight: 600;
        font-size: 14px;
      }
      @media (min-width: 900px) {
        .grid { grid-template-columns: 1fr 1fr; }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <h1>AVEREO CONNECT - Démo en ligne</h1>
        <p>Choisis la vue à ouvrir. Les liens sont prêts pour validation rapide avec ton équipe.</p>
      </section>

      <section class="grid">
        <article class="card">
          <h2>V1 Dynamique (React)</h2>
          <p>Version applicative V1 avec mode preview auto.</p>
          <a class="btn" href="./v1/index.html?preview=1">Dashboard V1</a>
          <a class="btn" href="./v1/index.html?preview=1&view=bien&bienId=1">Dossier Bien #1</a>
          <a class="btn" href="./v1/rendu-v1.html">Comparatif rendu V1</a>
        </article>

        <article class="card">
          <h2>V1 Statique (sans dépendances)</h2>
          <p>Version fiable même si CDN bloqué.</p>
          <a class="btn" href="./v1/rendu-v1-static.html">Ouvrir rendu statique</a>
          <a class="btn" href="./v1/standalone-v1.html">Standalone React</a>
        </article>

        <article class="card">
          <h2>Prototype Métier</h2>
          <p>Prototype historique du tunnel métier.</p>
          <a class="btn" href="./prototype/index.html">Ouvrir prototype</a>
        </article>
      </section>
    </div>
  </body>
</html>
`;

  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
};

const main = () => {
  cleanOutDir();
  copyDir(path.join(root, "prototype-v1"), path.join(outDir, "prototype"));
  copyDir(path.join(root, "avereo-v1-base"), path.join(outDir, "v1"));
  writeLandingPage();
  console.log(`Pages bundle ready: ${outDir}`);
};

main();
