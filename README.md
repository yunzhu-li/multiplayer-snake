snake-multiplayer
-----
A network snake game synchronization made with nodejs and socket.io.

A **live demo** is available at: [https://apps.yunzhu.li/snake](https://apps.yunzhu.li/snake)

![Screen Recording](resources/screen_recording.gif)

Branches
-----

`master` - For low-latency networks (<100ms RTT). Simple and robust.

`rollback_and_prediction` - For high-latency networks. Using `rollback & prediction` non-blocking synchronization.

Run Your Own Copy
-----
This application is available as a docker image.

- Make sure you have access to `docker`.

- Run:
  ```
  docker run -d --rm -p 8000:8000 -e SERVER_URI="http://<server-ip>:8000" yunzhu/snake-multiplayer
  ```

- Access `http://<server-ip>:8000` in your browser.

> The 2 environment variables `SERVER_URI` and `SOCKET_IO_PATH` (optional) are used to configure the socket.io connection info for the client page served by the container.
>
> The container always serves client page at `/` and socket.io connection at `/socket.io/`.
>
> See: https://socket.io/docs/client-api/#new-manager-url-options
