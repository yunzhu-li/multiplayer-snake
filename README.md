snake-multiplayer
------

A network snake game synchronization made with nodejs and socket.io.

#### Branches

`master` - For high-latency networks. Using `rollback & prediction` non-blocking synchronization strategy

`blocking_synchronized_version` - For low-latency networks (<100ms RTT). Simple and robust.

#### Live Demo

A live demo is hosted on: [https://yunzhu.li/apps/snake](https://yunzhu.li/apps/snake)

![Screen Recording](resources/screen_recording.gif)
