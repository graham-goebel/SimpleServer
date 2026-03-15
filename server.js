#!/usr/bin/env node
/**
 * SimpleServer – Node.js HTTP server for local project preview.
 * Zero dependencies: uses only Node.js built-ins.
 *
 * Usage:
 *   node server.js [directory] [port]
 *
 * Examples:
 *   node server.js              # serve current dir on port 8080
 *   node server.js ./dist       # serve ./dist on port 8080
 *   node server.js ./dist 3000  # serve ./dist on port 3000
 *
 * Environment:
 *   NO_BROWSER=1   – skip auto-opening the browser
 *   PORT=<n>       – alternative way to set the port
 */

"use strict";

const http = require("http");
const fs   = require("fs");
const path = require("path");
const net  = require("net");
const os   = require("os");

// ── Config ────────────────────────────────────────────────────────────────────

const args        = process.argv.slice(2);
const serveDir    = path.resolve(args[0] || ".");
const preferredPort =
  parseInt(args[1] || process.env.PORT || "8080", 10);

const NO_BROWSER =
  process.env.NO_BROWSER === "1" ||
  process.env.NO_BROWSER === "true" ||
  process.env.CI !== undefined;

// ── Colour helpers ────────────────────────────────────────────────────────────

const c = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  green:  "\x1b[32m",
  cyan:   "\x1b[36m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  gray:   "\x1b[90m",
};

const log = {
  info:  (m) => console.log(`${c.cyan}[info]${c.reset}  ${m}`),
  ok:    (m) => console.log(`${c.green}[ok]${c.reset}    ${m}`),
  warn:  (m) => console.log(`${c.yellow}[warn]${c.reset}  ${m}`),
  error: (m) => console.error(`${c.red}[error]${c.reset} ${m}`),
  dim:   (m) => console.log(`${c.gray}${m}${c.reset}`),
};

// ── MIME types ────────────────────────────────────────────────────────────────

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".htm":  "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".mjs":  "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".ts":   "text/typescript",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
  ".otf":  "font/otf",
  ".mp4":  "video/mp4",
  ".webm": "video/webm",
  ".mp3":  "audio/mpeg",
  ".wav":  "audio/wav",
  ".pdf":  "application/pdf",
  ".txt":  "text/plain; charset=utf-8",
  ".xml":  "application/xml; charset=utf-8",
  ".wasm": "application/wasm",
  ".map":  "application/json",
};

function getMime(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

// ── Port helpers ──────────────────────────────────────────────────────────────

function isFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => { server.close(); resolve(true); });
    server.listen(port, "0.0.0.0");
  });
}

async function findFreePort(preferred) {
  for (let p = preferred; p < preferred + 20; p++) {
    if (await isFree(p)) return p;
  }
  throw new Error(`No free port found between ${preferred} and ${preferred + 19}.`);
}

function getLocalIP() {
  try {
    const ifaces = os.networkInterfaces();
    for (const name of Object.keys(ifaces)) {
      for (const iface of ifaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) return iface.address;
      }
    }
  } catch { /* ignore */ }
  return "127.0.0.1";
}

// ── Request handler ───────────────────────────────────────────────────────────

function buildAutoIndex(dirPath, urlPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const rows = entries
    .sort((a, b) => {
      if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
      return a.name.localeCompare(b.name);
    })
    .map((e) => {
      const slash = e.isDirectory() ? "/" : "";
      const href  = encodeURIComponent(e.name) + slash;
      return `<li><a href="${href}">${e.name}${slash}</a></li>`;
    })
    .join("\n    ");

  const parent = urlPath !== "/" ? `<li><a href="../">../</a></li>\n    ` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Index of ${urlPath}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1   { font-size: 1.25rem; color: #333; border-bottom: 1px solid #ddd; padding-bottom: .5rem; }
    ul   { list-style: none; padding: 0; }
    li   { padding: .25rem 0; }
    a    { color: #0070f3; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Index of ${urlPath}</h1>
  <ul>
    ${parent}${rows}
  </ul>
</body>
</html>`;
}

function handleRequest(req, res) {
  // CORS + cache headers useful for IDE webviews.
  res.setHeader("Access-Control-Allow-Origin",  "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Decode URL, strip query string.
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split("?")[0]);
  } catch {
    res.writeHead(400);
    res.end("Bad Request");
    return;
  }

  // Prevent path traversal.
  const absPath = path.join(serveDir, urlPath);
  if (!absPath.startsWith(serveDir + path.sep) && absPath !== serveDir) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  let stat;
  try { stat = fs.statSync(absPath); }
  catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end(`404 Not Found: ${urlPath}`);
    if (!urlPath.includes(".")) {
      log.warn(`404 ${req.method} ${urlPath}`);
    }
    return;
  }

  if (stat.isDirectory()) {
    // Try index.html first.
    const index = path.join(absPath, "index.html");
    if (fs.existsSync(index)) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      fs.createReadStream(index).pipe(res);
      return;
    }
    // Auto-generated directory listing.
    const html = buildAutoIndex(absPath, urlPath.endsWith("/") ? urlPath : urlPath + "/");
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(html);
    return;
  }

  // Serve file.
  res.writeHead(200, {
    "Content-Type":   getMime(absPath),
    "Content-Length": stat.size,
  });
  fs.createReadStream(absPath).pipe(res);
}

// ── Browser open ──────────────────────────────────────────────────────────────

function openBrowser(url) {
  const { execSync } = require("child_process");
  const cmds = {
    linux:  `xdg-open "${url}" 2>/dev/null || sensible-browser "${url}" 2>/dev/null`,
    darwin: `open "${url}"`,
    win32:  `start "" "${url}"`,
  };
  const cmd = cmds[process.platform];
  if (!cmd) return;
  try { execSync(cmd, { stdio: "ignore" }); } catch { /* ignore */ }
}

// ── Main ──────────────────────────────────────────────────────────────────────

(async () => {
  if (!fs.existsSync(serveDir)) {
    log.error(`Directory not found: ${serveDir}`);
    process.exit(1);
  }

  const port = await findFreePort(preferredPort);
  const localUrl   = `http://localhost:${port}`;
  const networkUrl = `http://${getLocalIP()}:${port}`;

  const server = http.createServer(handleRequest);

  server.listen(port, () => {
    console.log();
    log.ok(`${c.bold}SimpleServer running${c.reset}`);
    console.log();
    log.info(`Serving:  ${serveDir}`);
    log.info(`Local:    ${c.bold}${localUrl}${c.reset}`);
    log.info(`Network:  ${networkUrl}`);
    console.log();
    log.dim("Press Ctrl+C to stop.");
    console.log();

    if (!NO_BROWSER) {
      setTimeout(() => openBrowser(localUrl), 800);
    }
  });

  process.on("SIGINT",  () => { console.log(); log.info("Shutting down..."); server.close(() => process.exit(0)); });
  process.on("SIGTERM", () => { server.close(() => process.exit(0)); });
})();
