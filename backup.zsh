#!/bin/zsh
set -euo pipefail

# -------------------------------
# Grandma's Kitchen – Backup Script
# -------------------------------

# Config (you can override these via environment variables)
: "${PROJECT_NAME:=grandmas-kitchen}"
: "${DEST_DIR:=$PWD/archive}"

# ISO timestamp (UTC)
NOW_ISO="$(date -u +"%Y%m%d-%H%M%SZ")"

# Ensure destination exists
mkdir -p "$DEST_DIR"

# Exclude patterns (zsh-safe)
typeset -a ZIP_EXCLUDES
ZIP_EXCLUDES=(
  '.git/*'
  'node_modules/*'
  'dist/*'
  '.cache/*'
  '*.log'
  '.DS_Store'
  '.__MACOSX/*'
  'archive/*'
)

# === 2) Zip the code (repo root) ===
CODE_ZIP="${DEST_DIR}/${PROJECT_NAME}-code-${NOW_ISO}.zip"

if command -v zip >/dev/null 2>&1; then
  zip -r "$CODE_ZIP" . -x "${ZIP_EXCLUDES[@]}"
else
  CODE_ZIP="${DEST_DIR}/${PROJECT_NAME}-code-${NOW_ISO}.tar.gz"
  tar -czf "$CODE_ZIP" \
    --exclude-vcs \
    --exclude='.git' --exclude='node_modules' --exclude='dist' --exclude='.cache' \
    --exclude='*.log' --exclude='.DS_Store' \
    .
fi

echo "✅ Created: $CODE_ZIP"
