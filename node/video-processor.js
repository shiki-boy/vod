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
                multipleHls(data.videoPath, data.videoName)
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

function multipleHls(videoPath, videoName) {
    const outputPath = `./videos/${videoName}`

    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true })
    }

    const qualities = ["640x360", "800x480", "1280x720", "1920x1080"]

    // create hls segments for each qualitiy
    qualities.forEach((q) => {
        const qName = q.split("x").at(-1) // 360, 480 ...
        const hlsPath = `${outputPath}/${qName}_index.m3u8`

        const sp = spawn("ffmpeg", [
            "-i",
            videoPath,
            "-codec:v",
            "libx264",
            "-codec:a",
            "aac",
            "-s",
            q,
            "-hls_time",
            "10",
            "-hls_playlist_type",
            "vod",
            "-hls_segment_filename",
            `${outputPath}/${qName}_segment%03d.ts`,
            "-start_number",
            "0",
            hlsPath,
        ])

        sp.stdout.on("data", function (msg) {
            console.log(msg.toString())
        })
        sp.stdout.on("close", function (msg) {
            console.log(msg.toString())
            console.log("✅ COMMAND COMPLETED: " + q)
        })
        sp.stderr.on("data", function (err) {
            console.error("GOT ERROR: " + err)
        })
    })

    // create 1 master m3u8 file containing which quality to use for which bandwidth
    const content = `
#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=375000,RESOLUTION=640x360
360_index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=750000,RESOLUTION=800x480
480_index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2000000,RESOLUTION=1280x720
720_index.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3500000,RESOLUTION=1920x1080
1080_index.m3u8
`
    fs.writeFile(outputPath + '/master_index.m3u8', content.trim(), (err) => {
        if (err) {
            console.error("there was error in master command: " + err)
        } else {
            console.log('✅ Master command ran successfully!')
        }
    })
}

function processSingleHls(videoPath, videoName) {
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
