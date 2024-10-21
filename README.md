# Video Transcoding

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