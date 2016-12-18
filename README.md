snake-multiplayer
-----
A network snake game synchronization made with nodejs and socket.io.

A **live demo** is hosted on: [https://apps.yunzhu.li/snake](https://apps.yunzhu.li/snake)

![Screen Recording](resources/screen_recording.gif)

Branches
-----

`master` - For low-latency networks (<100ms RTT). Simple and robust.

`rollback_and_prediction` - For high-latency networks. Using `rollback & prediction` non-blocking synchronization.

Build & Run Your Own Copy
-----
It is very easy to run this containerized app.

- Make sure you have `docker` and `docker-compose` installed on your local environment.

- Clone this repo, in the repo root, run:
```
docker-compose up -d
```

- Access `http://localhost:8000` in your browser. Others can access via `http://<your-ip>:8000`.

- Play!

- If you run it on remote server

  - If you run this app on a remote server, find this line in `client/snake_client.js`:

  ```
  var socket = io('http://127.0.0.1:8000', {reconnectionAttempts: 3});
  ```

  - Change the IP address (and port) accordingly.
