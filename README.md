# SimpleServer

Zero-dependency local HTTP server for previewing projects in any browser or
AI-assisted IDE (Cursor, Windsurf, VS Code, etc.).

## Quick start

```bash
# Clone / copy this repo next to your project, then:
./serve.sh                   # serve current directory on port 8080
./serve.sh ./dist            # serve a build output folder
./serve.sh ./dist 3000       # custom port
```

The browser opens automatically. Press **Ctrl+C** to stop.

---

## Files

| File | Description |
|------|-------------|
| `serve.sh` | Smart launcher – picks the best available runtime automatically |
| `server.py` | Python 3 server (stdlib only, no pip install needed) |
| `server.js` | Node.js server (stdlib only, no npm install needed) |

---

## Requirements

You need **one** of the following:

| Runtime | Min version | Notes |
|---------|-------------|-------|
| Node.js | 14+ | Preferred – best MIME support & directory listing |
| Python  | 3.6+ | Falls back to `python3 -m http.server` if `server.py` is missing |
| Python  | 2.7 | Last resort – uses `SimpleHTTPServer`, no auto-open |

---

## Usage

### Shell launcher (recommended)

```bash
# Serve current directory
./serve.sh

# Serve a specific folder
./serve.sh path/to/folder

# Custom port
./serve.sh path/to/folder 5173

# Skip opening the browser (CI / headless)
NO_BROWSER=1 ./serve.sh
```

### Node.js directly

```bash
node server.js [directory] [port]

# Examples
node server.js
node server.js ./public
node server.js ./public 4000
```

### Python 3 directly

```bash
python3 server.py [directory] [port]

# Examples
python3 server.py
python3 server.py ./public
python3 server.py ./public 4000
```

---

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NO_BROWSER` | *(unset)* | Set to `1` to skip auto-opening the browser |
| `PORT` | `8080` | Default port (overridden by the positional argument) |
| `CI` | *(unset)* | Detected automatically – disables auto-open in CI pipelines |

---

## Features

- **Auto-open browser** – the default URL opens in your system browser on start
- **Port collision handling** – if the requested port is busy the next free port
  is used automatically (up to +19)
- **Directory listing** – clean HTML index when no `index.html` is present
- **CORS headers** – `Access-Control-Allow-Origin: *` on every response so
  assets load correctly inside IDE embedded webviews (Cursor, Windsurf, etc.)
- **No cache** – `Cache-Control: no-cache` so you always see the latest file
- **Path traversal protection** – requests cannot escape the served directory
- **Network URL** – the LAN address is printed so you can preview on a phone or
  another device on the same Wi-Fi

---

## Using inside an AI-assisted IDE

Most AI IDEs (Cursor, Windsurf, VS Code + Copilot, etc.) embed a browser panel
that can load `localhost` URLs. Start the server from the integrated terminal:

```bash
./serve.sh ./dist 8080
```

Then open the embedded browser / Simple Browser and navigate to
`http://localhost:8080`.

> **Tip:** set `NO_BROWSER=1` if the IDE's embedded browser should open
> automatically instead of your system browser.

---

## Troubleshooting

**Port already in use**
The server tries up to 20 consecutive ports. If all are busy, free a port
manually with `lsof -ti:<port> | xargs kill` (macOS/Linux) or check Task
Manager on Windows.

**Browser doesn't open**
Run with the URL printed in the terminal. On Linux make sure `xdg-utils` is
installed (`sudo apt install xdg-utils`).

**Files not updating**
The server disables caching. Do a hard refresh in the browser
(**Ctrl+Shift+R** / **Cmd+Shift+R**).
