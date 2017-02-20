#!/bin/sh
set -euo pipefail

# Replace server uri
sed -i "s|var server_uri.*|var server_uri = '$SERVER_URI';|" /app/client/snake_client.js
sed -i "s|var socket_io_path.*|var socket_io_path = '$SOCKET_IO_PATH';|" /app/client/snake_client.js

nginx
exec node /app/server/
