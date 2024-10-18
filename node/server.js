import express from "express"
import cors from "cors"
import multer from "multer"
import fs from "fs"
import amqp from "amqplib"
import { JSONFilePreset } from "lowdb/node"
import morgan from "morgan"

const app = express()

let channel = null // video processor queue
const queue = "video_processor"
const CHUNKS_DIR = "./chunks"
let db

// using disk storage to keep the original video file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads")
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
        cb(null, file.fieldname + "-" + uniqueSuffix)
    },
})
const upload = multer({ storage })

app.use(morgan("dev"));
app.use(
    cors({
        origin: [
            "http://127.0.0.1:5500",
            "http://localhost:5500",
            "http://localhost:3000",
        ],
        credentials: true,
    })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/static", express.static("videos"))

app.post("/upload", upload.single("video"), function (req, res) {
    const {
        file,
        body: { totalChunks, currentChunk, fileName },
    } = req

    // checking video name, has to be unique
    const { videos } = db.data
    if (videos.find((v) => v === fileName)) {
        res.status(400).json({ message: "This video already exists" })
    }

    const chunkFilename = `${fileName}.${currentChunk}`
    const chunkPath = `${CHUNKS_DIR}/${chunkFilename}`
    fs.rename(file.path, chunkPath, (err) => {
        if (err) {
            console.error("Error moving chunk file:", err)
            res.status(500).send("Error uploading chunk")
        } else {
            if (+currentChunk === +totalChunks) {
                // All chunks have been uploaded, assemble them into a single file
                assembleChunks(fileName, totalChunks)
                    .then(async (filePath) => {
                        // saving video name to DB
                        db.data.videos.push(fileName)
                        await db.write()
                        const data = {
                            videoPath: filePath,
                            videoName: fileName,
                        }
                        channel.sendToQueue(
                            queue,
                            Buffer.from(JSON.stringify(data))
                        )
                        console.log("sending for processing..." + filePath)
                        res.send("File uploaded successfully")
                    })
                    .catch((err) => {
                        console.error("Error assembling chunks:", err)
                        res.status(500).send("Error assembling chunks")
                    })
            } else {
                res.send("Chunk uploaded successfully")
            }
        }
    })
})

app.get("/videos", (req, res) => {
    const { videos } = db.data

    res.json(videos)
})

async function assembleChunks(filename, totalChunks) {
    const filePath = `./uploads/${filename}.mp4`
    const writeStream = fs.createWriteStream(filePath)
    for (let i = 1; i <= totalChunks; i++) {
        const chunkFilePath = `${CHUNKS_DIR}/${filename}.${i}`
        const chunkBuffer = fs.readFileSync(chunkFilePath)
        writeStream.write(chunkBuffer)
        // Delete the chunk file after merging
        fs.unlink(chunkFilePath, (err) => {
            if (err) {
                console.log("Error in deleting chunk " + err)
            }
        })
    }
    writeStream.end()
    return filePath
}

app.listen(8000, function () {
    console.log("App is listening at port 8000...")
    initVideoProcessor().then((queue_channel) => (channel = queue_channel))
    initDb().then((DB) => (db = DB))
})

async function initVideoProcessor() {
    try {
        const connection = await amqp.connect(
            "amqp://guest:guest@localhost:5672/"
        )
        const channel = await connection.createChannel()

        await channel.assertQueue(queue, { durable: false })

        console.log("✅ Connected to video processor")

        return channel
        // channel.sendToQueue(queue, Buffer.from(JSON.stringify(text)))
    } catch (err) {
        console.error(err)
    }
    process.once("SIGINT", async () => {
        await channel.close()
        await connection.close()
    })
}

async function initDb() {
    return await JSONFilePreset("../db.json", {})
    // db.data.videos.push('hello world')
    // await db.write()
}
