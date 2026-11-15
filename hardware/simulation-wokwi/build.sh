#!/usr/bin/env bash
# Builds the real firmware (hardware/firmware/wearable-node/src) for the Wokwi VS Code extension.
# Needs: arduino-cli + core esp32:esp32 + libraries in libraries.txt
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/../firmware/wearable-node/src"
CLI="$(command -v arduino-cli || echo "$HOME/bin/arduino-cli")"
rm -rf "$HERE/sketch" && mkdir -p "$HERE/sketch/galley_node"
cp "$SRC/main.cpp" "$HERE/sketch/galley_node/galley_node.ino"
cp "$SRC/frame.h" "$SRC/temp.h" "$HERE/sketch/galley_node/"
"$CLI" compile --fqbn esp32:esp32:esp32 --output-dir "$HERE/build" "$HERE/sketch/galley_node"
echo "OK -> $HERE/build (open diagram.json in VS Code with the Wokwi extension and press Start)"
