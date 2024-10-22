# Video Transcoding

1. Choose a video to upload
2. Video gets uploaded in chunks
3. After upload complete, the video gets processed by the video processor through rabbit mq
4. The video name gets saved in db.json file
5. The video gets split into segment for HLS in different qualities.

### Ffmeg
<i>In future can make video processor a docker container</i> <br>
`sudo apt install ffmpeg`

### Rabbit mq
`docker-compose up`

### Servers
```
cd node

nodemon server.js  # api server

nodemon video_processor.js  # rabbit mq consumer
```

### Frontend
```
cd frontend
pnpm dev
```

### Clean videos
```
pnpm clean
```