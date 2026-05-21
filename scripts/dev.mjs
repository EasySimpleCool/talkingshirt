import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..", "public");
const START_PORT = Number(process.env.PORT) || 8888;
const MAX_TRIES = 10;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function handler(port) {
  return async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
      let path = decodeURIComponent(url.pathname);
      if (path.endsWith("/")) path += "index.html";

      const filePath = join(ROOT, path);
      if (!filePath.startsWith(ROOT)) {
        res.writeHead(403).end("Forbidden");
        return;
      }

      const body = await readFile(filePath);
      const type = MIME[extname(filePath)] ?? "application/octet-stream";
      res.writeHead(200, { "Content-Type": type }).end(body);
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && err.code === "ENOENT") {
        res.writeHead(404).end("Not found");
        return;
      }
      res.writeHead(500).end("Server error");
      console.error(err);
    }
  };
}

function tryListen(port) {
  return new Promise((resolve, reject) => {
    const server = createServer(handler(port));
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      server.off("error", reject);
      resolve({ server, port });
    });
  });
}

async function main() {
  for (let port = START_PORT; port < START_PORT + MAX_TRIES; port++) {
    try {
      await tryListen(port);
      const base = `http://127.0.0.1:${port}`;
      console.log(`TalkingSh*rt dev server: ${base}/`);
      console.log(`  rebuild.html → ${base}/rebuild.html`);
      if (port !== START_PORT) {
        console.log(`  (port ${START_PORT} was busy — using ${port})`);
      }
      return;
    } catch (err) {
      if (err.code !== "EADDRINUSE") throw err;
    }
  }

  console.error(
    `\nPorts ${START_PORT}–${START_PORT + MAX_TRIES - 1} are in use (likely a previous npm run dev).\n` +
      `Stop it:\n  lsof -ti :${START_PORT} | xargs kill\n` +
      `Or pick another port:\n  PORT=3000 npm run dev\n`,
  );
  process.exit(1);
}

main();
