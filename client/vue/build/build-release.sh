#!/bin/bash
set -ev

# create dist if not exist
mkdir -p ./dist

# Update version.js with latest
NIGHTLY_VERSION=`npm info | grep latest | cut -d " " -f 2`
echo "window.PARAVIEW_QUAKE_VERSION = '$NIGHTLY_VERSION';" > dist/version.js

npm run build:release
npm run validate

# Needed if not a release for nightly bundle
npm run bundle
