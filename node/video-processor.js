import amqp from "amqplib"
import { spawn } from "child_process"
import fs from "fs"

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
                startProcess(data.videoPath, data.videoName)
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

function startProcess(videoPath, videoName) {
    const outputPath = `./videos/${videoName}`

    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true })
    }

    const hlsPath = `${outputPath}/index.m3u8`

    const sp = spawn("ffmpeg", [
        "-i",
        videoPath,
        "-codec:v",
        "libx264",
        "-codec:a",
        "aac",
        "-hls_time",
        "10",
        "-hls_playlist_type",
        "vod",
        "-hls_segment_filename",
        `${outputPath}/segment%03d.ts`,
        "-start_number",
        "0",
        hlsPath,
    ])

    sp.stdout.on("data", function (msg) {
        console.log(msg.toString())
    })
    sp.stderr.on("data", function (err) {
        console.error("GOT ERROR: " + err)
    })
}
