#!/usr/bin/env bash
# ==============================================================================
#  Norish LXC installer / updater for Proxmox VE — native, no Docker
#  App:    https://github.com/norish-recipes/norish  (AGPL-3.0)
#  Source: builds from your fork (REPO below) — upstream releases optional.
#  Style:  same shape as community-scripts / helper-scripts.com, self-contained.
#
#  Everything the Docker Compose stack runs, as plain Debian services:
#    norish            Node server (Next.js + tRPC + workers + embedded Python parser)
#    norish-obscura    Obscura headless browser (stealth build) for URL imports
#    postgresql        Debian 13's PostgreSQL 17 (same major as the compose file)
#    redis-server      realtime events + job queues
#
#  ON THE PROXMOX HOST (as root):
#     bash norish-lxc.sh                                  # interactive create + install
#     bash norish-lxc.sh --ctid 121 --auth-url https://recipes.example.com --yes
#     bash norish-lxc.sh update 121                       # update the app in CT 121
#     bash norish-lxc.sh update 121 --ref my-branch       # deploy a branch of the fork
#     bash norish-lxc.sh update 121 --repo norish-recipes/norish   # switch to upstream releases
#     bash norish-lxc.sh auto-update 121 on               # nightly update of CT 121 (see below)
#     bash norish-lxc.sh auto-update 121 on --notify-url https://ntfy.sh/<your-topic>
#
#  MIGRATING FROM DOCKER (see --help for how to produce these files):
#     bash norish-lxc.sh --ctid 121 --auth-url https://recipes.example.com \
#          --master-key '<your existing MASTER_KEY>' \
#          --restore-db norish.dump --restore-uploads uploads.tgz
#
#  INSIDE THE CONTAINER:
#     update                         # newest commit on main (fork) / newest release (upstream)
#     update --ref v0.24.0-beta      # a specific tag, branch or commit
#     update --force                 # rebuild the current version
#     norish-lxc.sh --auto-update on|off|status    # nightly 'update' via a systemd timer
#
#  AUTO-UPDATE runs 'update' at night: it only rebuilds when the source moved,
#  backs up the database first and rolls back if the new version won't start.
#  It deploys whatever the CT tracks: your fork's main (you decide what gets
#  merged), or every new upstream release if the CT tracks upstream. Settings
#  (schedule, alert URL) live in /etc/norish/auto-update.env.
#
#  Run it from a saved file (bash norish-lxc.sh), not "bash -c $(curl …)",
#  because the host copies this same file into the container.
# ==============================================================================
set -Eeuo pipefail
export LANG=C.UTF-8 LC_ALL=C.UTF-8
# 'pct exec' starts with a minimal PATH that lacks /usr/local/bin, where uv and
# this script's own helpers live. Set the standard Debian root PATH explicitly.
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin${PATH:+:$PATH}"

# ------------------------------------------------------------------ constants
APP="Norish"
NSAPP="norish"
DEFAULT_REPO="aaronjevitt/norish"          # where builds come from (your fork)
UPSTREAM_REPO="norish-recipes/norish"      # upstream: deploys its newest release
APP_DIR="/opt/${NSAPP}"                    # built source tree (replaced on update)
DATA_DIR="/opt/${NSAPP}-data"              # uploads/ and bin/ (yt-dlp)  -> BACK UP
PY_DIR="/opt/${NSAPP}-python"              # uv-managed CPython for the parser venv
OBSCURA_DIR="/opt/${NSAPP}-obscura"
CONF_DIR="/etc/${NSAPP}"
ENV_FILE="${CONF_DIR}/${NSAPP}.env"        # runtime config (kept on update)
VERSION_ENV="${CONF_DIR}/version.env"      # NORISH_VERSION_REPORT_JSON (rewritten each build)
SOURCE_ENV="${CONF_DIR}/source.env"        # which repo this CT builds from (kept on update)
VERSION_FILE="/opt/${NSAPP}_version.txt"
BACKUP_DIR="/opt/${NSAPP}-backups"
SERVICE="${NSAPP}"
OBSCURA_SERVICE="${NSAPP}-obscura"
SVC_USER="${NSAPP}"
DB_NAME="norish"; DB_USER="norish"
APP_PORT="3000"; OBSCURA_PORT="9222"
SELF_INSTALL_PATH="/usr/local/bin/${NSAPP}-lxc.sh"
STAGE_DIR="/root/${NSAPP}-import"          # where the host drops migration files
AUTO_ENV="${CONF_DIR}/auto-update.env"     # auto-update schedule + alert URL (kept on update)
AUTO_UNIT="${NSAPP}-auto-update"           # systemd service + timer name
UPDATE_LOCK="/run/${NSAPP}-update.lock"    # one update at a time, manual or timed

# ------------------------------------------------------------------- defaults
CTID=""; HN="${NSAPP}"
CORES="4"; RAM="4096"; SWAP="2048"; DISK="20"   # the Next.js build is the hungry part
STORAGE=""; TMPL_STORAGE=""; BRIDGE="vmbr0"
NET_IP="dhcp"; NET_GW=""; VLAN=""
UNPRIV="1"; PASSWORD=""; ONBOOT="1"
AUTH_URL=""            # external URL Norish is reached at; empty -> http://<ip>:3000
MASTER_KEY_IN=""       # reuse an existing key when migrating
RESTORE_DB=""; RESTORE_UPLOADS=""
ASSUME_YES="0"; FORCE="0"; REF=""; MODE=""; REPO_ARG=""
AUTO_ACTION=""; NOTIFY_URL_IN=""

# ------------------------------------------------------------------- helpers
YW=$'\033[33m'; GN=$'\033[1;92m'; RD=$'\033[01;31m'; CL=$'\033[m'; BOLD=$'\033[1m'
msg_info() { echo -e " ${YW}⏳${CL} $*"; }
msg_ok()   { echo -e " ${GN}✔${CL} $*"; }
msg_warn() { echo -e " ${YW}⚠${CL} $*"; }
msg_error(){ echo -e " ${RD}✖${CL} $*" >&2; }
die()      { msg_error "$*"; exit 1; }
trap 'msg_error "Failed at line $LINENO: $BASH_COMMAND"' ERR

usage() {
  awk 'NR>2 && /^# =+$/ {exit} NR>2' "$0" | sed -E 's/^# ?//'
  cat <<EOF

Create options (host):
  --ctid N  --hostname NAME  --cores N  --memory MB  --swap MB  --disk GB
  --storage NAME  --bridge NAME  --ip dhcp|CIDR  --gw IP  --vlan TAG
  --privileged  --password PW
  --auth-url URL        the URL people open, e.g. https://recipes.example.com
  --repo OWNER/NAME     GitHub repo to build from (default: ${DEFAULT_REPO});
                        remembered in ${SOURCE_ENV} for later updates
  --ref TAG|BRANCH|SHA  what to build (default: 'main' for a fork, the newest
                        release, betas included, for ${UPSTREAM_REPO})
  --auto-update on      also install the nightly auto-update timer
  --notify-url URL      where auto-update posts failures (ntfy topic URL or any
                        endpoint that takes a plain-text POST)
  --yes

Auto-update (host: 'auto-update <CTID> ACTION', inside the CT: '--auto-update ACTION'):
  on      install/enable the timer (default: nightly 04:00 + up to 30 min jitter)
  off     disable it (settings in ${AUTO_ENV} are kept)
  status  show the timer and the last run

Migrating an existing Docker install (run on the old Docker host):
  1. Database:   docker exec norish-db pg_dump -U postgres -Fc norish > norish.dump
  2. Uploads:    docker run --rm -v <uploads-volume-or-path>:/u alpine \\
                   tar czf - -C /u . > uploads.tgz
                 (volume name: 'docker volume ls | grep norish'; for a bind
                 mount, just: tar czf uploads.tgz -C /path/to/uploads .)
  3. MASTER_KEY: copy it from your compose file / .env — it decrypts the
                 secrets Norish stored (OAuth, AI keys). A new key = those are lost.
  Copy the two files to the Proxmox host, then:
     bash $0 --master-key '<key>' --restore-db norish.dump --restore-uploads uploads.tgz ...
  Restoring into an existing CT works too (inside it, or 'pct push' the files):
     bash $SELF_INSTALL_PATH --restore-only --restore-db F --restore-uploads F [--master-key K]
EOF
}

# ------------------------------------------------------------- arg parsing
while [[ $# -gt 0 ]]; do
  case "$1" in
    update)            MODE="host-update"; CTID="${2:-}"; [[ $# -gt 1 ]] && shift ;;
    auto-update)       MODE="host-auto"; CTID="${2:-}"; AUTO_ACTION="status"
                       [[ $# -gt 1 ]] && shift
                       if [[ $# -gt 1 && "${2:-}" != -* ]]; then AUTO_ACTION="$2"; shift; fi ;;
    --auto-update)     AUTO_ACTION="$2"; shift ;;
    --notify-url)      NOTIFY_URL_IN="$2"; shift ;;
    --install-only)    MODE="ct-install" ;;
    --update-only)     MODE="ct-update" ;;
    --restore-only)    MODE="ct-restore" ;;
    --ctid)            CTID="$2"; shift ;;
    --hostname)        HN="$2"; shift ;;
    --cores)           CORES="$2"; shift ;;
    --memory)          RAM="$2"; shift ;;
    --swap)            SWAP="$2"; shift ;;
    --disk)            DISK="$2"; shift ;;
    --storage)         STORAGE="$2"; shift ;;
    --bridge)          BRIDGE="$2"; shift ;;
    --ip)              NET_IP="$2"; shift ;;
    --gw)              NET_GW="$2"; shift ;;
    --vlan)            VLAN="$2"; shift ;;
    --privileged)      UNPRIV="0" ;;
    --password)        PASSWORD="$2"; shift ;;
    --auth-url)        AUTH_URL="${2%/}"; shift ;;
    --master-key)      MASTER_KEY_IN="$2"; shift ;;
    --restore-db)      RESTORE_DB="$2"; shift ;;
    --restore-uploads) RESTORE_UPLOADS="$2"; shift ;;
    --repo)            REPO_ARG="$2"; shift ;;
    --ref)             REF="$2"; shift ;;
    --force)           FORCE="1" ;;
    --yes|-y)          ASSUME_YES="1" ;;
    -h|--help)         usage; exit 0 ;;
    *) die "Unknown argument: $1 (see --help)" ;;
  esac
  shift
done

# --repo wins; else what this CT was installed from; else the default.
REPO="$DEFAULT_REPO"
if [[ -n "$REPO_ARG" ]]; then REPO="$REPO_ARG"
elif [[ -f "$SOURCE_ENV" ]]; then REPO="$(sed -n 's/^REPO=//p' "$SOURCE_ENV")"; REPO="${REPO:-$DEFAULT_REPO}"
fi
[[ "$REPO" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]] || die "Invalid --repo '${REPO}' (expected OWNER/NAME)"
[[ -z "$AUTO_ACTION" || "$AUTO_ACTION" =~ ^(on|off|status|run)$ ]] \
  || die "Invalid auto-update action '${AUTO_ACTION}' (on, off or status)"

# ==============================================================================
#                         CONTAINER-SIDE FUNCTIONS
# ==============================================================================

BUILD_LOG="/var/log/${NSAPP}-build.log"
run_logged() {
  # Long, noisy steps: full output to the build log, last lines on failure.
  echo "== $(date -Is) $*" >> "$BUILD_LOG"
  if ! "$@" >> "$BUILD_LOG" 2>&1; then
    msg_error "Step failed: $*"; tail -n 40 "$BUILD_LOG" >&2
    die "Full log: $BUILD_LOG"
  fi
}

latest_tag() {
  # Norish ships pre-releases (vX.Y.Z-beta), which /releases/latest skips, so
  # take the newest entry of the full releases list; tags as a fallback.
  local t
  t="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases?per_page=5" 2>/dev/null \
      | sed -n 's/.*"tag_name": *"\([^"]*\)".*/\1/p' | head -1 || true)"
  if [[ -z "$t" ]]; then
    t="$(git ls-remote --tags --refs "https://github.com/${REPO}.git" 2>/dev/null \
        | sed 's#.*/##' | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+(-[a-z0-9.]+)?$' | sort -V | tail -1 || true)"
  fi
  [[ -n "$t" ]] || die "Could not determine the latest ${APP} release of ${REPO}"
  echo "$t"
}

default_ref() {
  # A fork has no releases of its own: track its main branch.
  if [[ "$REPO" == "$UPSTREAM_REPO" ]]; then latest_tag; else echo "main"; fi
}

resolve_ref() {
  # Pin a branch to its current commit ("main@1a2b3c4d5e6f") so 'update' only
  # rebuilds when the branch actually moved. Tags and SHAs pass through.
  local ref="$1" sha
  sha="$(git ls-remote "https://github.com/${REPO}.git" "refs/heads/${ref}" 2>/dev/null | awk '{print $1; exit}' || true)"
  if [[ -n "$sha" ]]; then echo "${ref}@${sha:0:12}"; else echo "$ref"; fi
}

save_source() {
  mkdir -p "$CONF_DIR"
  echo "REPO=${REPO}" > "$SOURCE_ENV"
}

fetch_source() {
  # $1 is a resolve_ref label: "branch@sha", a tag, or a commit SHA.
  local label="$1" ref archive tmp
  ref="${label%%@*}"
  archive="${label#*@}"                    # the SHA for a branch, else the ref itself
  tmp="$(mktemp -d)"; mkdir -p "$tmp/src"
  msg_info "Downloading ${APP} ${label} from ${REPO}"
  # /archive/<ref>.tar.gz resolves branches, tags and commit SHAs alike.
  if curl -fsSL "https://github.com/${REPO}/archive/${archive}.tar.gz" -o "$tmp/src.tgz"; then
    tar -xzf "$tmp/src.tgz" -C "$tmp/src" --strip-components=1
  else
    msg_warn "Tarball download failed — falling back to git clone"
    rm -rf "$tmp/src"
    git clone --quiet --depth 1 --branch "$ref" "https://github.com/${REPO}.git" "$tmp/src"
    rm -rf "$tmp/src/.git"
  fi
  # Same trim as upstream's .dockerignore + Docker deps stage: the server build
  # needs apps/web, apps/parser-api, packages/* and tooling/* — not the mobile
  # app, the docs site, the landing page or the browser-extension submodule.
  rm -rf "$tmp/src/apps/mobile" "$tmp/src/apps/landing" "$tmp/src/apps/docs" \
         "$tmp/src/apps/quick-import-extension" "$tmp/src/docs" "$tmp/src/.scratch"
  rm -rf "${APP_DIR}.new"; mv "$tmp/src" "${APP_DIR}.new"; rm -rf "$tmp"
  msg_ok "Downloaded ${APP} ${label}"
}

install_base() {
  export DEBIAN_FRONTEND=noninteractive
  msg_info "Installing system packages (PostgreSQL, Redis, ffmpeg, build tools)"
  apt-get update -qq
  apt-get install -y -qq curl ca-certificates gnupg git openssl jq sudo \
    postgresql redis-server ffmpeg \
    build-essential python3 pkg-config >/dev/null
  systemctl enable -q --now postgresql redis-server
  msg_ok "Installed system packages ($(psql --version | awk '{print $1" "$3}'), $(redis-server --version | awk '{print $3}'))"

  local node_major="${1:-22}"
  if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | sed 's/v\([0-9]*\).*/\1/')" != "$node_major" ]]; then
    msg_info "Installing Node.js ${node_major}"
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
      | gpg --dearmor --yes -o /etc/apt/keyrings/nodesource.gpg
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_${node_major}.x nodistro main" \
      > /etc/apt/sources.list.d/nodesource.list
    apt-get update -qq; apt-get install -y -qq nodejs >/dev/null
    msg_ok "Installed Node.js $(node -v)"
  fi

  if ! command -v uv >/dev/null 2>&1; then
    # Straight from the GitHub release: the astral.sh install script has changed
    # how it picks its target directory, and silently landed in ~/.local/bin.
    msg_info "Installing uv (Python toolchain for the recipe parser)"
    local uvarch tmp
    case "$(uname -m)" in x86_64) uvarch=x86_64 ;; aarch64) uvarch=aarch64 ;; *) die "No uv build for $(uname -m)" ;; esac
    tmp="$(mktemp -d)"
    curl -fsSL "https://github.com/astral-sh/uv/releases/latest/download/uv-${uvarch}-unknown-linux-gnu.tar.gz" -o "$tmp/uv.tgz"
    tar -xzf "$tmp/uv.tgz" -C "$tmp" --strip-components=1
    install -m 755 "$tmp/uv" "$tmp/uvx" /usr/local/bin/
    rm -rf "$tmp"
    command -v uv >/dev/null 2>&1 || die "uv install failed"
    msg_ok "Installed $(uv --version)"
  fi

  id "$SVC_USER" >/dev/null 2>&1 || useradd --system --home-dir "$DATA_DIR" --shell /usr/sbin/nologin "$SVC_USER"
}

build_app() {
  local tree="${APP_DIR}.new" pnpm_ver py_ver
  pnpm_ver="$(jq -r '.packageManager // "pnpm@10" | sub("^pnpm@";"")' "$tree/package.json")"
  py_ver="$(tr -d '[:space:]' < "$tree/.python-version" 2>/dev/null || echo 3.14)"

  if [[ "$(pnpm --version 2>/dev/null)" != "$pnpm_ver" ]]; then
    msg_info "Installing pnpm ${pnpm_ver}"
    run_logged npm install -g "pnpm@${pnpm_ver}"
    msg_ok "Installed pnpm $(pnpm --version)"
  fi

  msg_info "Installing JavaScript dependencies (several minutes)"
  ( cd "$tree" && CI=1 SKIP_PARSER_API_INSTALL=1 run_logged pnpm install --frozen-lockfile )
  msg_ok "Installed JavaScript dependencies"

  msg_info "Setting up Python ${py_ver} environment for the recipe parser"
  export UV_PYTHON_INSTALL_DIR="$PY_DIR" UV_LINK_MODE=copy
  run_logged uv python install "$py_ver"
  ( cd "$tree" && UV_PYTHON_DOWNLOADS=never run_logged uv sync --project apps/parser-api --locked --python "$py_ver" )
  msg_ok "Parser environment ready"

  msg_info "Building ${APP} (Next.js + server bundle — 5-15 min, be patient)"
  ( cd "$tree" && export NODE_ENV=production SKIP_ENV_VALIDATION=1 NEXT_TELEMETRY_DISABLED=1 \
      TURBO_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1 \
      DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" \
      NODE_OPTIONS="--max-old-space-size=3072" && run_logged pnpm run build )
  [[ -f "$tree/dist-server/index.mjs" ]] || die "Build finished but dist-server/index.mjs is missing"
  rm -rf "$tree/apps/web/.next/cache" "$tree/apps/web/.next/trace"
  msg_ok "Built ${APP}"
}

write_version_env() {
  # The admin "About" panel reads this; the Docker image bakes it in at build.
  local json; json="$(cd "$APP_DIR" && node tooling/monorepo/scripts/print-package-versions.mjs 2>/dev/null || true)"
  mkdir -p "$CONF_DIR"
  if [[ -n "$json" && "$json" != *"'"* ]]; then
    printf "NORISH_VERSION_REPORT_JSON='%s'\n" "$(tr -d '\n' <<<"$json")" > "$VERSION_ENV"
  else
    : > "$VERSION_ENV"
  fi
}

install_ytdlp() {
  # Norish can manage yt-dlp itself (Admin -> video parsing); seed the version
  # this release expects so video imports work from the start.
  local ver bin arch
  ver="$(sed -nE 's/^ARG YT_DLP_VERSION=(.*)$/\1/p' "${APP_DIR}/docker/Dockerfile" | head -1)"
  [[ -n "$ver" ]] || return 0
  arch="$(uname -m)"; bin="yt-dlp_linux"; [[ "$arch" == "aarch64" ]] && bin="yt-dlp_linux_aarch64"
  mkdir -p "$DATA_DIR/bin"
  if [[ ! -x "$DATA_DIR/bin/yt-dlp" ]] || ! "$DATA_DIR/bin/yt-dlp" --version 2>/dev/null | grep -qx "$ver"; then
    msg_info "Installing yt-dlp ${ver}"
    curl -fsSL --retry 3 "https://github.com/yt-dlp/yt-dlp/releases/download/${ver}/${bin}" -o "$DATA_DIR/bin/yt-dlp" \
      && chmod 755 "$DATA_DIR/bin/yt-dlp" && msg_ok "Installed yt-dlp ${ver}" \
      || msg_warn "yt-dlp download failed — video imports can install it from the Admin page"
  fi
}

install_obscura() {
  # Same pin and same '-stealth' release archive upstream's image repackages.
  local pin="${APP_DIR}/docker/obscura/pin.env" repo ver arch cur=""
  repo="$(sed -nE 's/^OBSCURA_REPO=(.*)$/\1/p' "$pin")"
  ver="$(sed -nE 's/^OBSCURA_VERSION=(.*)$/\1/p' "$pin")"
  [[ -n "$repo" && -n "$ver" ]] || die "Could not read the Obscura pin from $pin"
  case "$(uname -m)" in x86_64) arch=x86_64 ;; aarch64) arch=aarch64 ;; *) die "No Obscura build for $(uname -m)" ;; esac
  [[ -f "$OBSCURA_DIR/VERSION" ]] && cur="$(cat "$OBSCURA_DIR/VERSION")"
  if [[ "$cur" != "$ver" ]]; then
    msg_info "Installing Obscura ${ver} (stealth build)"
    local tmp; tmp="$(mktemp -d)"
    curl -fsSL "${repo}/releases/download/v${ver}/obscura-${arch}-linux-stealth.tar.gz" -o "$tmp/o.tgz"
    tar -xzf "$tmp/o.tgz" -C "$tmp" obscura obscura-worker
    mkdir -p "$OBSCURA_DIR"
    install -m 755 "$tmp/obscura" "$tmp/obscura-worker" "$OBSCURA_DIR/"
    echo "$ver" > "$OBSCURA_DIR/VERSION"; rm -rf "$tmp"
    msg_ok "Installed Obscura ${ver}"
  fi
  cat > "/etc/systemd/system/${OBSCURA_SERVICE}.service" <<EOF
[Unit]
Description=Obscura headless browser for ${APP} URL imports (CDP on 127.0.0.1:${OBSCURA_PORT})
After=network-online.target
Wants=network-online.target

[Service]
# Loopback only: anyone who can reach the CDP port can drive the browser.
# No --allow-private-network, matching upstream: imports can't reach your LAN.
ExecStart=${OBSCURA_DIR}/obscura serve --host 127.0.0.1 --port ${OBSCURA_PORT} --stealth
DynamicUser=yes
CacheDirectory=${OBSCURA_SERVICE}
Environment=HOME=/var/cache/${OBSCURA_SERVICE}
Restart=always
RestartSec=3
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable -q "$OBSCURA_SERVICE"
  systemctl restart "$OBSCURA_SERVICE"
}

setup_database() {
  # Idempotent: creates the role/db on first run, leaves them alone after.
  local pw
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
    pw="$(openssl rand -hex 24)"
    sudo -u postgres psql -q -c "CREATE ROLE ${DB_USER} LOGIN PASSWORD '${pw}'"
    echo "$pw" > "${CONF_DIR}/.dbpass"; chmod 600 "${CONF_DIR}/.dbpass"
  fi
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
    sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
    msg_ok "Created PostgreSQL database '${DB_NAME}'"
  fi
}

db_url() { echo "postgres://${DB_USER}:$(cat "${CONF_DIR}/.dbpass")@127.0.0.1:5432/${DB_NAME}"; }

write_env_file() {
  [[ -f "$ENV_FILE" ]] && return
  mkdir -p "$CONF_DIR"
  local ip key url
  ip="$(hostname -I 2>/dev/null | awk '{print $1}')"
  url="${AUTH_URL:-http://${ip}:${APP_PORT}}"
  key="${MASTER_KEY_IN:-$(openssl rand -base64 32)}"
  cat > "$ENV_FILE" <<EOF
# ${APP} runtime configuration — read by ${SERVICE}.service.
# Reference: https://github.com/${UPSTREAM_REPO}/blob/main/.env.example
# After editing:  systemctl restart ${SERVICE}

# The URL people open Norish at (your Caddy/NPM domain once proxied).
# Sign-in and OAuth callbacks only work from this exact origin.
AUTH_URL=${url}
# Extra origins allowed to sign in, comma separated — keep the direct LAN
# address here so http://${ip}:${APP_PORT} still works behind a proxy.
TRUSTED_ORIGINS=http://${ip}:${APP_PORT}

# Encrypts stored secrets (OAuth/AI keys). BACK THIS UP; never change it
# on an existing database or those secrets become unreadable.
MASTER_KEY=${key}

DATABASE_URL=$(db_url)
REDIS_URL=redis://127.0.0.1:6379
OBSCURA_ENDPOINT=ws://127.0.0.1:${OBSCURA_PORT}

UPLOADS_DIR=${DATA_DIR}/uploads
YT_DLP_BIN_DIR=${DATA_DIR}/bin
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
HOST=0.0.0.0
PORT=${APP_PORT}

# First admin: password auth is on by default when no other provider is set.
# Configure OIDC/GitHub/Google here, or later under Settings -> Admin.
# PASSWORD_AUTH_ENABLED=true
# OIDC_NAME=  OIDC_ISSUER=  OIDC_CLIENT_ID=  OIDC_CLIENT_SECRET=
# DEFAULT_LOCALE=en
# NEXT_PUBLIC_LOG_LEVEL=info
EOF
  chmod 600 "$ENV_FILE"; chown root:"$SVC_USER" "$ENV_FILE"; chmod 640 "$ENV_FILE"
  msg_ok "Wrote ${ENV_FILE}"
  if [[ -z "$MASTER_KEY_IN" ]]; then
    msg_warn "Generated a new MASTER_KEY — it's in ${ENV_FILE}; back it up."
  fi
}

write_service() {
  cat > "/etc/systemd/system/${SERVICE}.service" <<EOF
[Unit]
Description=${APP} recipe app
After=network-online.target postgresql.service redis-server.service ${OBSCURA_SERVICE}.service
Wants=network-online.target ${OBSCURA_SERVICE}.service
Requires=postgresql.service redis-server.service

[Service]
Type=simple
User=${SVC_USER}
Group=${SVC_USER}
# Repo root: migrations, the parser venv and apps/web are found relative to it.
WorkingDirectory=${APP_DIR}
EnvironmentFile=${ENV_FILE}
EnvironmentFile=-${VERSION_ENV}
ExecStart=/usr/bin/node ${APP_DIR}/dist-server/index.mjs
# 'always': the Admin page's "restart server" just exits and expects this.
Restart=always
RestartSec=5
TimeoutStartSec=300
NoNewPrivileges=yes
ProtectSystem=full
PrivateTmp=yes
ReadWritePaths=${DATA_DIR} ${APP_DIR}/apps/web/.next

[Install]
WantedBy=multi-user.target
EOF
  systemctl daemon-reload
  systemctl enable -q "$SERVICE"
}

fix_perms() {
  mkdir -p "$DATA_DIR/uploads" "$DATA_DIR/bin" "$BACKUP_DIR"
  chown -R "$SVC_USER:$SVC_USER" "$DATA_DIR"
  chmod 750 "$DATA_DIR"
  # Code is root-owned and read-only to the service, except Next's runtime cache.
  chown -R root:root "$APP_DIR"; chmod -R o-w "$APP_DIR"
  mkdir -p "$APP_DIR/apps/web/.next/cache"
  chown -R "$SVC_USER:$SVC_USER" "$APP_DIR/apps/web/.next"
  chmod 755 "$PY_DIR" 2>/dev/null || true
}

wait_healthy() {
  local i
  # Up to 5 min: a release's first start runs migrations and one-off backfills
  # (0.25 seeds the ingredient catalogue) before it answers the health check.
  for i in $(seq 1 100); do
    curl -fsS "http://127.0.0.1:${APP_PORT}/api/v1/health" >/dev/null 2>&1 && return 0
    systemctl is-failed -q "$SERVICE" && return 1
    sleep 3
  done
  return 1
}

backup_db() {
  local tag="$1" f
  mkdir -p "$BACKUP_DIR"
  f="${BACKUP_DIR}/${NSAPP}-db-${tag//[^A-Za-z0-9._-]/_}-$(date +%Y%m%d-%H%M%S).dump"
  sudo -u postgres pg_dump -Fc "$DB_NAME" > "$f"
  ls -1t "${BACKUP_DIR}"/*.dump 2>/dev/null | tail -n +4 | xargs -r rm -f   # keep the last 3
  echo "$f"
}

restore_db_file() {
  # Restores into an emptied database owned by the app role, so every object
  # ends up owned by '${DB_USER}' (a Docker dump says 'postgres' everywhere).
  local f="$1"
  [[ -f "$f" ]] || die "Database dump not found: $f"
  msg_info "Restoring database from $(basename "$f")"
  sudo -u postgres dropdb --if-exists "$DB_NAME"
  sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"
  local pw; pw="$(cat "${CONF_DIR}/.dbpass")"
  if head -c 5 "$f" | grep -q PGDMP; then
    PGPASSWORD="$pw" pg_restore --no-owner --no-privileges --exit-on-error \
      -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" "$f"
  else
    # plain SQL: strip ownership/privilege statements aimed at 'postgres'
    sed -E '/^ALTER .* OWNER TO /d; /^(GRANT|REVOKE) /d' "$f" \
      | PGPASSWORD="$pw" psql -q -v ON_ERROR_STOP=1 -h 127.0.0.1 -U "$DB_USER" -d "$DB_NAME" >/dev/null
  fi
  msg_ok "Restored database"
}

restore_uploads_file() {
  local f="$1"
  [[ -f "$f" ]] || die "Uploads archive not found: $f"
  msg_info "Restoring uploads from $(basename "$f")"
  mkdir -p "$DATA_DIR/uploads"
  tar -xzf "$f" -C "$DATA_DIR/uploads"
  chown -R "$SVC_USER:$SVC_USER" "$DATA_DIR/uploads"
  msg_ok "Restored $(find "$DATA_DIR/uploads" -type f | wc -l) upload files"
}

set_master_key() {
  [[ -n "$MASTER_KEY_IN" ]] || return 0
  sed -i "s#^MASTER_KEY=.*#MASTER_KEY=${MASTER_KEY_IN//#/\\#}#" "$ENV_FILE"
  msg_ok "MASTER_KEY set from --master-key"
}

install_update_cmd() {
  if [[ -f "$0" && "$(readlink -f "$0")" != "$SELF_INSTALL_PATH" ]]; then
    install -m 755 "$0" "$SELF_INSTALL_PATH"
  fi
  cat > /usr/local/bin/update <<EOF
#!/usr/bin/env bash
exec bash "${SELF_INSTALL_PATH}" --update-only "\$@"
EOF
  chmod 755 /usr/local/bin/update
}

motd() {
  local url; url="$(sed -n 's/^AUTH_URL=//p' "$ENV_FILE" 2>/dev/null)"
  cat > /etc/motd <<EOF

  ${APP} — realtime self-hosted recipe app
  ----------------------------------------
  Web UI    : ${url}   (direct: http://$(hostname -I 2>/dev/null | awk '{print $1}'):${APP_PORT}/)
  Config    : ${ENV_FILE}   (AUTH_URL, MASTER_KEY, auth providers)
  Data      : ${DATA_DIR}/uploads + PostgreSQL db '${DB_NAME}'
  Backups   : ${BACKUP_DIR}  (DB dumps taken before every update)
  Logs      : journalctl -u ${SERVICE} -f      (browser: -u ${OBSCURA_SERVICE})
  Update    : update   (or: update --force / update --ref <tag|branch>)
  Auto      : $(systemctl is-enabled -q "${AUTO_UNIT}.timer" 2>/dev/null && echo "nightly (${NSAPP}-lxc.sh --auto-update status)" || echo "off (${NSAPP}-lxc.sh --auto-update on)")
  Source    : ${REPO}
  Version   : $(cat "$VERSION_FILE" 2>/dev/null)

EOF
}

node_major_for() {
  local v; v="$(tr -d '[:space:]v' < "$1/.nvmrc" 2>/dev/null || true)"
  echo "${v%%.*}" | grep -E '^[0-9]+$' || echo 22
}

ct_install() {
  [[ $EUID -eq 0 ]] || die "Run as root"
  grep -qE '^13' /etc/debian_version 2>/dev/null || msg_warn "Tested on Debian 13 (PostgreSQL 17); continuing anyway"
  msg_info "Installing ${APP} into $(hostname)"
  command -v curl >/dev/null && command -v git >/dev/null \
    || { apt-get update -qq && DEBIAN_FRONTEND=noninteractive apt-get install -y -qq curl ca-certificates git >/dev/null; }
  local ref; ref="$(resolve_ref "${REF:-$(default_ref)}")"
  fetch_source "$ref"
  install_base "$(node_major_for "${APP_DIR}.new")"
  build_app
  rm -rf "$APP_DIR"; mv "${APP_DIR}.new" "$APP_DIR"
  mkdir -p "$CONF_DIR"
  save_source
  setup_database
  write_env_file
  write_version_env
  fix_perms
  install_ytdlp
  install_obscura
  write_service

  # Migration: data must be in place before the first start, or the app's own
  # migrations create an empty schema the restore would collide with.
  [[ -n "$RESTORE_DB" ]] && restore_db_file "$RESTORE_DB"
  [[ -n "$RESTORE_UPLOADS" ]] && restore_uploads_file "$RESTORE_UPLOADS"
  fix_perms

  echo "$ref" > "$VERSION_FILE"
  msg_info "Starting ${APP} (first start runs database migrations)"
  systemctl restart "$SERVICE"
  install_update_cmd
  motd
  if wait_healthy; then msg_ok "${APP} ${ref} is up"
  else msg_warn "Health check failed — see: journalctl -u ${SERVICE} -n 80"; fi
  [[ "$AUTO_ACTION" == "on" ]] && ct_auto on
  rm -rf "$STAGE_DIR"
  msg_info "Cleaning up"
  apt-get -y -qq autoremove >/dev/null; apt-get -y -qq autoclean >/dev/null
  pnpm store prune >/dev/null 2>&1 || true; uv cache clean >/dev/null 2>&1 || true
  msg_ok "Done"
}

ct_restore() {
  [[ $EUID -eq 0 ]] || die "Run as root"
  [[ -f "$VERSION_FILE" ]] || die "${APP} is not installed here"
  [[ -n "$RESTORE_DB$RESTORE_UPLOADS$MASTER_KEY_IN" ]] || die "Nothing to restore (--restore-db / --restore-uploads / --master-key)"
  systemctl stop "$SERVICE"
  if [[ -n "$RESTORE_DB" ]]; then
    msg_ok "Safety dump of the current database: $(backup_db pre-restore)"
    restore_db_file "$RESTORE_DB"
  fi
  [[ -n "$RESTORE_UPLOADS" ]] && restore_uploads_file "$RESTORE_UPLOADS"
  set_master_key
  fix_perms
  systemctl start "$SERVICE"
  wait_healthy && msg_ok "${APP} is up with the restored data" \
    || msg_warn "Health check failed — journalctl -u ${SERVICE} -n 80"
  rm -rf "$STAGE_DIR"
}

ct_update() {
  [[ $EUID -eq 0 ]] || die "Run as root"
  [[ -d "$APP_DIR" && -f "$VERSION_FILE" ]] || die "${APP} is not installed here (run with --install-only first)"
  # A manual 'update' and the nightly timer must never swap the app at once.
  exec 9>"$UPDATE_LOCK"
  flock -n 9 || die "Another ${APP} update is already running"
  local current target dump rc
  current="$(cat "$VERSION_FILE")"
  target="$(resolve_ref "${REF:-$(default_ref)}")"
  if [[ "$current" == "$target" && "$FORCE" != "1" ]]; then
    msg_ok "${APP} is already at ${current} — nothing to do (use --force to rebuild)"
    return
  fi
  msg_info "Updating ${APP}: ${current} -> ${target} (${REPO})"
  fetch_source "$target"
  install_base "$(node_major_for "${APP_DIR}.new")"
  build_app                                   # the running app is untouched until here

  msg_info "Stopping ${APP} and backing up the database"
  systemctl stop "$SERVICE"
  dump="$(backup_db "$current")"
  msg_ok "Database backed up to ${dump}"

  rm -rf "${APP_DIR}.old"
  mv "$APP_DIR" "${APP_DIR}.old"
  mv "${APP_DIR}.new" "$APP_DIR"
  set +e
  ( set -e; write_version_env; fix_perms; install_ytdlp; install_obscura; write_service; systemctl start "$SERVICE" )
  rc=$?
  [[ $rc -eq 0 ]] && { wait_healthy; rc=$?; }
  set -e
  if [[ $rc -eq 0 ]]; then
    echo "$target" > "$VERSION_FILE"
    save_source
    rm -rf "${APP_DIR}.old"
    install_update_cmd; motd
    msg_ok "Updated ${APP} to ${target}"
  else
    msg_error "Update failed — rolling back to ${current} (code and database)"
    journalctl -u "$SERVICE" -n 30 --no-pager || true
    systemctl stop "$SERVICE" || true
    rm -rf "$APP_DIR"; mv "${APP_DIR}.old" "$APP_DIR"
    restore_db_file "$dump"                   # undo any migrations the new version ran
    write_version_env; fix_perms; install_obscura; write_service
    systemctl start "$SERVICE"
    wait_healthy && msg_ok "Rolled back to ${current}" || msg_warn "Rollback started but isn't healthy yet"
    exit 1
  fi
  pnpm store prune >/dev/null 2>&1 || true
}

auto_env_get() { sed -n "s/^$1=//p" "$AUTO_ENV" 2>/dev/null | tail -1; }

notify() {
  # Best effort: a failed alert is logged, never fatal. ntfy reads the Title
  # header; any endpoint that takes a plain-text POST gets the body.
  local url; url="$(auto_env_get NOTIFY_URL)"
  [[ -n "$url" ]] || return 0
  curl -fsS -m 15 -H "Title: $1" -H "Tags: $2" --data-binary "$3" "$url" >/dev/null \
    || msg_warn "Could not send the alert to ${url}"
}

write_auto_env() {
  mkdir -p "$CONF_DIR"
  if [[ ! -f "$AUTO_ENV" ]]; then
    cat > "$AUTO_ENV" <<EOF
# ${APP} auto-update settings. Apply changes with: ${NSAPP}-lxc.sh --auto-update on
#
# When to run (systemd OnCalendar syntax), plus up to 30 min random delay.
SCHEDULE=*-*-* 04:00
# Where to POST failures, e.g. https://ntfy.sh/<your-topic>. Empty: no alerts.
NOTIFY_URL=
# 1 = also alert when a new version was deployed.
NOTIFY_ON_SUCCESS=0
EOF
    chmod 600 "$AUTO_ENV"
  fi
  if [[ -n "$NOTIFY_URL_IN" ]]; then
    # awk, not sed: a webhook URL may hold '&', '#' or '/'.
    local tmp; tmp="$(mktemp)"
    NOTIFY_URL="$NOTIFY_URL_IN" awk '/^NOTIFY_URL=/ { print "NOTIFY_URL=" ENVIRON["NOTIFY_URL"]; next } { print }' \
      "$AUTO_ENV" > "$tmp"
    cat "$tmp" > "$AUTO_ENV"; rm -f "$tmp"
  fi
}

ct_auto() {
  [[ $EUID -eq 0 ]] || die "Run as root"
  case "$1" in
    on)
      [[ -f "$VERSION_FILE" ]] || die "${APP} is not installed here"
      write_auto_env
      local schedule; schedule="$(auto_env_get SCHEDULE)"
      if [[ "$REPO" == "$UPSTREAM_REPO" ]]; then
        msg_warn "This CT builds from ${UPSTREAM_REPO}: auto-update will deploy every new upstream release unreviewed."
      fi
      cat > "/etc/systemd/system/${AUTO_UNIT}.service" <<EOF
[Unit]
Description=${APP} auto-update (rebuilds only when the source moved)
After=network-online.target ${SERVICE}.service
Wants=network-online.target

[Service]
Type=oneshot
ExecStart=/usr/bin/env bash ${SELF_INSTALL_PATH} --auto-update run
# Keep the running app responsive while the new version builds.
Nice=10
IOSchedulingClass=idle
TimeoutStartSec=2h
EOF
      cat > "/etc/systemd/system/${AUTO_UNIT}.timer" <<EOF
[Unit]
Description=Nightly ${APP} auto-update

[Timer]
OnCalendar=${schedule:-*-*-* 04:00}
RandomizedDelaySec=30min
# Not Persistent: a CT that was off at night skips the run rather than
# rebuilding in the middle of someone's day.
Persistent=false

[Install]
WantedBy=timers.target
EOF
      systemctl daemon-reload
      systemctl enable -q --now "${AUTO_UNIT}.timer"
      msg_ok "Auto-update on (${schedule:-*-*-* 04:00}); settings: ${AUTO_ENV}"
      [[ -n "$(auto_env_get NOTIFY_URL)" ]] || msg_warn "No NOTIFY_URL set: a failed or rolled-back update will only show in: journalctl -u ${AUTO_UNIT}"
      if [[ -f "$ENV_FILE" ]]; then motd; fi
      ;;
    off)
      systemctl disable -q --now "${AUTO_UNIT}.timer" 2>/dev/null || true
      msg_ok "Auto-update off (settings kept in ${AUTO_ENV})"
      if [[ -f "$ENV_FILE" ]]; then motd; fi
      ;;
    status)
      if systemctl is-enabled -q "${AUTO_UNIT}.timer" 2>/dev/null; then
        msg_ok "Auto-update is on"
        systemctl list-timers --no-pager "${AUTO_UNIT}.timer" | head -2
      else
        msg_warn "Auto-update is off (enable: ${NSAPP}-lxc.sh --auto-update on)"
      fi
      echo; echo "Last run:"
      journalctl -u "${AUTO_UNIT}.service" -n 15 --no-pager -o cat 2>/dev/null || true
      ;;
    run) ct_auto_run ;;
  esac
}

ct_auto_run() {
  # What the timer runs: a plain 'update', with an alert when it did not end
  # where it started cleanly. The update runs as its own process so its exit
  # (a failed build, or a rollback) cannot take the alert down with it.
  local before after log rc
  trap - ERR                                  # a failed update is reported below, not traced
  before="$(cat "$VERSION_FILE" 2>/dev/null)"
  log="$(mktemp)"
  set +e
  bash "$SELF_INSTALL_PATH" --update-only 2>&1 | tee "$log"
  rc=${PIPESTATUS[0]}
  set -e
  after="$(cat "$VERSION_FILE" 2>/dev/null)"
  local tail_txt; tail_txt="$(tail -n 15 "$log" | sed -E 's/\x1B\[[0-9;]*m//g')"
  rm -f "$log"

  if [[ $rc -ne 0 ]]; then
    local what="${APP} auto-update failed on $(hostname); still running ${before}"
    grep -q "rolling back" <<<"$tail_txt" && what="${APP} auto-update rolled back on $(hostname); still running ${before}"
    notify "$what" "warning" "${tail_txt}

Details: journalctl -u ${AUTO_UNIT} -n 200"
    exit "$rc"
  fi
  if [[ "$before" != "$after" && "$(auto_env_get NOTIFY_ON_SUCCESS)" == "1" ]]; then
    notify "${APP} updated on $(hostname)" "white_check_mark" "${before} -> ${after}"
  fi
}

host_auto() {
  [[ -n "$CTID" ]] || die "Usage: $0 auto-update <CTID> on|off|status"
  pct status "$CTID" >/dev/null 2>&1 || die "CT ${CTID} does not exist"
  [[ "$(pct status "$CTID")" == "status: running" ]] || pct start "$CTID"
  # The timer runs the CT's copy of this script, so ship the current one.
  pct push "$CTID" "$0" "$SELF_INSTALL_PATH" --perms 0755
  local extra=(--auto-update "$AUTO_ACTION")
  [[ -n "$NOTIFY_URL_IN" ]] && extra+=(--notify-url "$NOTIFY_URL_IN")
  ct_exec bash "$SELF_INSTALL_PATH" "${extra[@]}"
}

# ==============================================================================
#                           HOST-SIDE FUNCTIONS
# ==============================================================================

is_pve_host() { command -v pct >/dev/null 2>&1 && [[ -d /etc/pve ]]; }
ct_exec() { pct exec "$CTID" -- env LANG=C.UTF-8 LC_ALL=C.UTF-8 "$@"; }

push_restore_files() {
  # Copy migration files into the CT and rewrite the paths to point there.
  RESTORE_ARGS=()
  [[ -n "$RESTORE_DB$RESTORE_UPLOADS" ]] && ct_exec mkdir -p "$STAGE_DIR"
  if [[ -n "$RESTORE_DB" ]]; then
    [[ -f "$RESTORE_DB" ]] || die "Database dump not found: $RESTORE_DB"
    pct push "$CTID" "$RESTORE_DB" "$STAGE_DIR/db.dump"; RESTORE_ARGS+=(--restore-db "$STAGE_DIR/db.dump")
  fi
  if [[ -n "$RESTORE_UPLOADS" ]]; then
    [[ -f "$RESTORE_UPLOADS" ]] || die "Uploads archive not found: $RESTORE_UPLOADS"
    pct push "$CTID" "$RESTORE_UPLOADS" "$STAGE_DIR/uploads.tgz"; RESTORE_ARGS+=(--restore-uploads "$STAGE_DIR/uploads.tgz")
  fi
  [[ -n "$MASTER_KEY_IN" ]] && RESTORE_ARGS+=(--master-key "$MASTER_KEY_IN")
  return 0
}

host_update() {
  [[ -n "$CTID" ]] || die "Usage: $0 update <CTID>"
  pct status "$CTID" >/dev/null 2>&1 || die "CT ${CTID} does not exist"
  [[ "$(pct status "$CTID")" == "status: running" ]] || pct start "$CTID"
  pct push "$CTID" "$0" "$SELF_INSTALL_PATH" --perms 0755
  if [[ -n "$RESTORE_DB$RESTORE_UPLOADS$MASTER_KEY_IN" ]]; then
    push_restore_files
    ct_exec bash "$SELF_INSTALL_PATH" --restore-only "${RESTORE_ARGS[@]}"
    return
  fi
  local extra=()
  [[ "$FORCE" == "1" ]] && extra+=(--force)
  [[ -n "$REF" ]] && extra+=(--ref "$REF")
  # Only an explicit --repo overrides what the CT remembers in its source.env.
  [[ -n "$REPO_ARG" ]] && extra+=(--repo "$REPO_ARG")
  ct_exec bash "$SELF_INSTALL_PATH" --update-only "${extra[@]}"
}

pick_template() {
  msg_info "Refreshing template catalogue"
  pveam update >/dev/null 2>&1 || true
  local tmpl arch
  arch="$(dpkg --print-architecture 2>/dev/null || uname -m)"
  [[ "$arch" == "x86_64" ]] && arch="amd64"; [[ "$arch" == "aarch64" ]] && arch="arm64"
  # Debian 13 only: its PostgreSQL 17 matches the postgres:17 the compose file
  # runs, so a Docker pg_dump restores without a version mismatch.
  tmpl="$(pveam available --section system 2>/dev/null | awk '{print $2}' \
        | grep -E "^debian-13-standard_.*_${arch}\.tar" | sort -V | tail -1 || true)"
  [[ -n "$tmpl" ]] || die "No Debian 13 ${arch} template available (check 'pveam available')"
  if ! pveam list "$TMPL_STORAGE" 2>/dev/null | grep -q "$tmpl"; then
    msg_info "Downloading template ${tmpl} to ${TMPL_STORAGE}"
    pveam download "$TMPL_STORAGE" "$tmpl" >/dev/null
  fi
  msg_ok "Using template ${tmpl}"
  TEMPLATE="${TMPL_STORAGE}:vztmpl/${tmpl}"
}

host_create() {
  [[ $EUID -eq 0 ]] || die "Run as root on the Proxmox host"
  [[ -f "$0" ]] || die "Run this script from a saved file (bash norish-lxc.sh); it copies itself into the container."
  [[ -z "$RESTORE_DB" || -f "$RESTORE_DB" ]] || die "Database dump not found: $RESTORE_DB"
  [[ -z "$RESTORE_UPLOADS" || -f "$RESTORE_UPLOADS" ]] || die "Uploads archive not found: $RESTORE_UPLOADS"
  if [[ -n "$RESTORE_DB" && -z "$MASTER_KEY_IN" ]]; then
    msg_warn "Restoring a database without --master-key: secrets it stores (OAuth/AI keys) won't decrypt."
  fi

  [[ -n "$CTID" ]] || CTID="$(pvesh get /cluster/nextid)"
  pct status "$CTID" >/dev/null 2>&1 && die "CT ${CTID} already exists"
  [[ -n "$STORAGE" ]]      || STORAGE="$(pvesm status --content rootdir 2>/dev/null | awk 'NR>1 && $3=="active"{print $1; exit}')"
  [[ -n "$TMPL_STORAGE" ]] || TMPL_STORAGE="$(pvesm status --content vztmpl 2>/dev/null | awk 'NR>1 && $3=="active"{print $1; exit}')"
  [[ -n "$STORAGE" && -n "$TMPL_STORAGE" ]] || die "Could not find container/template storage (--storage)"

  local net="name=eth0,bridge=${BRIDGE},ip=${NET_IP}"
  [[ "$NET_IP" != "dhcp" && -n "$NET_GW" ]] && net+=",gw=${NET_GW}"
  [[ -n "$VLAN" ]] && net+=",tag=${VLAN}"

  echo; echo -e "${BOLD}Container to create${CL}"
  printf "  %-12s %s\n" "CTID" "$CTID" "Hostname" "$HN" "OS" "Debian 13" \
    "Cores" "$CORES" "RAM/Swap" "${RAM} MB / ${SWAP} MB" "Disk" "${DISK} GB on ${STORAGE}" \
    "Network" "$net" "Type" "$([[ $UNPRIV == 1 ]] && echo unprivileged || echo privileged)" \
    "Source" "$REPO" \
    "Version" "${REF:-$([[ "$REPO" == "$UPSTREAM_REPO" ]] && echo "newest release" || echo main)}" \
    "AUTH_URL" "${AUTH_URL:-http://<container IP>:${APP_PORT}}" \
    "Auto-update" "$([[ "$AUTO_ACTION" == "on" ]] && echo "nightly" || echo "off")" \
    "Migrate" "$([[ -n "$RESTORE_DB$RESTORE_UPLOADS" ]] && echo "db: ${RESTORE_DB:-—}  uploads: ${RESTORE_UPLOADS:-—}" || echo "no (fresh install)")"
  echo
  if [[ "$ASSUME_YES" != "1" ]]; then
    read -r -p "Proceed? [y/N] " a; [[ "${a,,}" == "y" ]] || { echo "Aborted."; exit 0; }
  fi

  pick_template
  msg_info "Creating LXC ${CTID}"
  local pw_args=(); [[ -n "$PASSWORD" ]] && pw_args=(--password "$PASSWORD")
  pct create "$CTID" "$TEMPLATE" \
    --hostname "$HN" --cores "$CORES" --memory "$RAM" --swap "$SWAP" \
    --rootfs "${STORAGE}:${DISK}" --net0 "$net" \
    --unprivileged "$UNPRIV" --features nesting=1 \
    --onboot "$ONBOOT" --ostype debian --tags "${NSAPP};recipes" \
    --description "${APP} — https://github.com/${REPO}
Update: bash norish-lxc.sh update ${CTID}  (or run 'update' inside)" \
    "${pw_args[@]}" >/dev/null
  msg_ok "Created LXC ${CTID}"

  msg_info "Starting container and waiting for network"
  pct start "$CTID"
  local i
  for i in $(seq 1 30); do ct_exec bash -c "getent hosts deb.debian.org >/dev/null 2>&1" && break; sleep 2; done
  ct_exec bash -c "getent hosts deb.debian.org >/dev/null 2>&1" || die "Container has no network/DNS after 60 s"
  msg_ok "Container is online"

  pct push "$CTID" "$0" "$SELF_INSTALL_PATH" --perms 0755
  push_restore_files
  local extra=("${RESTORE_ARGS[@]}" --repo "$REPO")
  [[ -n "$AUTH_URL" ]] && extra+=(--auth-url "$AUTH_URL")
  [[ -n "$REF" ]] && extra+=(--ref "$REF")
  [[ "$AUTO_ACTION" == "on" ]] && extra+=(--auto-update on)
  [[ -n "$NOTIFY_URL_IN" ]] && extra+=(--notify-url "$NOTIFY_URL_IN")
  msg_info "Running installer inside CT ${CTID} (build takes 10-20 min)"
  ct_exec bash "$SELF_INSTALL_PATH" --install-only "${extra[@]}"

  local ip; ip="$(ct_exec hostname -I 2>/dev/null | awk '{print $1}')"
  echo
  msg_ok "${BOLD}${APP} is ready${CL}"
  echo "   Direct   : http://${ip}:${APP_PORT}/"
  echo "   AUTH_URL : ${AUTH_URL:-http://${ip}:${APP_PORT}}  (edit in ${ENV_FILE})"
  echo "   Proxy    : point Caddy/NPM at ${ip}:${APP_PORT} — WebSockets must pass through"
  echo "   Update   : bash $0 update ${CTID}   (or 'update' inside the CT)"
  echo "   Back up  : ${ENV_FILE} (MASTER_KEY!) — vzdump covers DB + uploads"
}

# ==============================================================================
#                                  DISPATCH
# ==============================================================================
case "$MODE" in
  ct-install)  ct_install ;;
  ct-update)   ct_update ;;
  ct-restore)  ct_restore ;;
  host-update) is_pve_host || die "'update <CTID>' runs on the Proxmox host (inside the CT just run: update)"; host_update ;;
  host-auto)   is_pve_host || die "'auto-update <CTID>' runs on the Proxmox host (inside the CT: --auto-update on|off|status)"; host_auto ;;
  "")
    if is_pve_host; then host_create
    elif [[ -n "$AUTO_ACTION" ]]; then ct_auto "$AUTO_ACTION"
    elif [[ -f "$VERSION_FILE" ]]; then ct_update
    else ct_install
    fi ;;
esac
