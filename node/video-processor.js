import amqp from "amqplib"
import { spawn } from "child_process"

const queue = "video_processor"

try {
    const connection = await amqp.connect("amqp://guest:guest@localhost:5672/")

    const channel = await connection.createChannel()

    process.once("SIGINT", async () => {
        await channel.close()
        await connection.close()
    })

    await channel.assertQueue(queue, { durable: false })

    await channel.consume(
        queue,
        (message) => {
            if (message) {
                const data = JSON.parse(message.content.toString())
                console.log("Received ", data)
                startProcess(data.videoPath)
            }
        },
        { noAck: true }
    )

    console.log(
        "✅ Video processor running successfully Waiting for messages..."
    )
} catch (error) {
    console.log("Got error in queue: " + error)
}

function startProcess(videoPath) {
    const outputPath = `./videos`
    const hlsPath = `${outputPath}/index-${Date.now()}.m3u8`

    const ffmpegCommand = `ffmpeg -i ${videoPath} -codec:v libx264 -codec:a aac -hls_time 10 -hls_playlist_type vod -hls_segment_filename "${outputPath}/segment%03d.ts" -start_number 0 ${hlsPath}`

    spawn(ffmpegCommand).stdout.on("data", function (msg) {
        console.log(msg.toString())
    })
}
