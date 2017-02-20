#!/bin/sh
set -euo pipefail

# Replace server uri
sed -i "s|var server_uri.*|var server_uri = '$SERVER_URI';|" /app/client/snake_client.js

nginx
node /app/server/
