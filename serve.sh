#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# serve.sh  –  Smart launcher for SimpleServer
#
# Detects the best available runtime (Node.js → Python 3 → Python 2 built-in)
# and starts an HTTP server for the given directory.
#
# Usage:
#   ./serve.sh [directory] [port]
#
# Examples:
#   ./serve.sh                  # serve current dir on port 8080
#   ./serve.sh ./dist           # serve ./dist on port 8080
#   ./serve.sh ./dist 3000      # serve ./dist on port 3000
#
# Environment variables:
#   NO_BROWSER=1   skip auto-opening the browser
#   PORT=<n>       default port (overridden by the positional argument)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colour helpers ────────────────────────────────────────────────────────────
if [ -t 1 ]; then          # only use colours when stdout is a terminal
  C_RESET="\033[0m"
  C_BOLD="\033[1m"
  C_GREEN="\033[32m"
  C_CYAN="\033[36m"
  C_YELLOW="\033[33m"
  C_RED="\033[31m"
  C_GRAY="\033[90m"
else
  C_RESET="" C_BOLD="" C_GREEN="" C_CYAN="" C_YELLOW="" C_RED="" C_GRAY=""
fi

log_info()  { echo -e "${C_CYAN}[info]${C_RESET}  $*"; }
log_ok()    { echo -e "${C_GREEN}[ok]${C_RESET}    $*"; }
log_warn()  { echo -e "${C_YELLOW}[warn]${C_RESET}  $*"; }
log_error() { echo -e "${C_RED}[error]${C_RESET} $*" >&2; }

# ── Arguments ─────────────────────────────────────────────────────────────────
DIR="${1:-.}"
PORT="${2:-${PORT:-8080}}"

if [ ! -d "$DIR" ]; then
  log_error "Directory not found: $DIR"
  exit 1
fi

# Resolve to absolute path.
DIR="$(cd "$DIR" && pwd)"

# ── Locate this script so we can find the bundled server files ────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Runtime detection ─────────────────────────────────────────────────────────
run_node() {
  if [ -f "$SCRIPT_DIR/server.js" ]; then
    log_info "Runtime: Node.js $(node --version)"
    exec node "$SCRIPT_DIR/server.js" "$DIR" "$PORT"
  else
    log_warn "server.js not found next to serve.sh – falling back."
    return 1
  fi
}

run_python3() {
  if [ -f "$SCRIPT_DIR/server.py" ]; then
    log_info "Runtime: $(python3 --version)"
    exec python3 "$SCRIPT_DIR/server.py" "$DIR" "$PORT"
  else
    # Fall back to the stdlib one-liner.
    log_info "Runtime: $(python3 --version) (stdlib)"
    log_warn "server.py not found – using python3 -m http.server (no auto-open)"
    cd "$DIR"
    exec python3 -m http.server "$PORT"
  fi
}

run_python2() {
  log_info "Runtime: $(python --version 2>&1) (stdlib)"
  log_warn "Using python2 SimpleHTTPServer (no auto-open, no CORS headers)"
  cd "$DIR"
  exec python -m SimpleHTTPServer "$PORT"
}

# ── Pick runtime ──────────────────────────────────────────────────────────────
echo
log_ok "${C_BOLD}SimpleServer${C_RESET}"
echo

if command -v node &>/dev/null && run_node; then
  : # exec above replaces the process; nothing more needed.
elif command -v python3 &>/dev/null; then
  run_python3
elif command -v python &>/dev/null; then
  run_python2
else
  log_error "No supported runtime found."
  log_error "Install Node.js (https://nodejs.org) or Python 3 and try again."
  exit 1
fi
