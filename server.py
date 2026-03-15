#!/usr/bin/env python3
"""
SimpleServer - Python HTTP server for local project preview.
Serves the current (or specified) directory over HTTP and optionally
opens the browser automatically.

Usage:
    python server.py [directory] [port]

Examples:
    python server.py              # serve current dir on port 8080
    python server.py ./dist       # serve ./dist on port 8080
    python server.py ./dist 3000  # serve ./dist on port 3000
"""

import http.server
import socketserver
import sys
import os
import socket
import webbrowser
import threading
import signal
import urllib.parse
from pathlib import Path


DEFAULT_PORT = 8080


class ColorLog:
    RESET  = "\033[0m"
    BOLD   = "\033[1m"
    GREEN  = "\033[32m"
    CYAN   = "\033[36m"
    YELLOW = "\033[33m"
    RED    = "\033[31m"
    GRAY   = "\033[90m"

    @staticmethod
    def info(msg):    print(f"{ColorLog.CYAN}[info]{ColorLog.RESET}  {msg}")
    @staticmethod
    def ok(msg):      print(f"{ColorLog.GREEN}[ok]{ColorLog.RESET}    {msg}")
    @staticmethod
    def warn(msg):    print(f"{ColorLog.YELLOW}[warn]{ColorLog.RESET}  {msg}")
    @staticmethod
    def error(msg):   print(f"{ColorLog.RED}[error]{ColorLog.RESET} {msg}")
    @staticmethod
    def dim(msg):     print(f"{ColorLog.GRAY}{msg}{ColorLog.RESET}")


class SilentHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler that suppresses per-request log noise."""

    def log_message(self, fmt, *args):
        # Only log non-2xx responses so the terminal stays clean.
        code = args[1] if len(args) > 1 else "???"
        try:
            if int(code) >= 400:
                ColorLog.warn(f"{self.command} {self.path} -> {code}")
        except (ValueError, AttributeError):
            pass

    def end_headers(self):
        # Allow requests from any origin (useful when embedded in an IDE webview).
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()


def find_free_port(preferred: int) -> int:
    """Return preferred port if free, otherwise find the next available one."""
    for port in range(preferred, preferred + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("", port))
                return port
            except OSError:
                continue
    raise RuntimeError("Could not find a free port in range "
                       f"{preferred}–{preferred + 19}.")


def get_local_ip() -> str:
    """Best-effort local network IP (falls back to 127.0.0.1)."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"


def open_browser(url: str, delay: float = 0.8):
    """Open the browser after a short delay so the server is ready."""
    def _open():
        import time
        time.sleep(delay)
        try:
            webbrowser.open(url)
        except Exception:
            pass  # Non-fatal — user can open manually.
    threading.Thread(target=_open, daemon=True).start()


def serve(directory: str, port: int, auto_open: bool = True):
    directory = os.path.realpath(directory)
    if not os.path.isdir(directory):
        ColorLog.error(f"Directory not found: {directory}")
        sys.exit(1)

    port = find_free_port(port)
    os.chdir(directory)

    handler = SilentHandler
    # Reuse address so a quick restart doesn't hit "Address already in use".
    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.TCPServer(("", port), handler) as httpd:
        local_url   = f"http://localhost:{port}"
        network_url = f"http://{get_local_ip()}:{port}"

        print()
        ColorLog.ok(f"{ColorLog.BOLD}SimpleServer running{ColorLog.RESET}")
        print()
        ColorLog.info(f"Serving:  {directory}")
        ColorLog.info(f"Local:    {ColorLog.BOLD}{local_url}{ColorLog.RESET}")
        ColorLog.info(f"Network:  {network_url}")
        print()
        ColorLog.dim("Press Ctrl+C to stop.")
        print()

        if auto_open:
            open_browser(local_url)

        def _shutdown(sig, frame):
            print()
            ColorLog.info("Shutting down...")
            threading.Thread(target=httpd.shutdown).start()

        signal.signal(signal.SIGINT,  _shutdown)
        signal.signal(signal.SIGTERM, _shutdown)

        httpd.serve_forever()


def main():
    args = sys.argv[1:]
    directory = args[0] if len(args) > 0 else "."
    try:
        port = int(args[1]) if len(args) > 1 else DEFAULT_PORT
    except ValueError:
        ColorLog.error(f"Invalid port: {args[1]}")
        sys.exit(1)

    # Respect NO_BROWSER / CI env vars to skip auto-open.
    auto_open = os.environ.get("NO_BROWSER", "").lower() not in ("1", "true", "yes") \
                and os.environ.get("CI", "") == ""

    serve(directory, port, auto_open=auto_open)


if __name__ == "__main__":
    main()
