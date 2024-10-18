import express from "express"
import cors from "cors"
import multer from "multer"
import fs from "fs"
import amqp from "amqplib"

const app = express()

let channel = null // video processor queue
const queue = "video_processor"

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

app.use(
    cors({
        origin: ["http://127.0.0.1:5500, http://localhost:5500"],
        credentials: true,
    })
)
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use("/static", express.static("videos"))

const CHUNKS_DIR = "./chunks"
app.post("/upload", upload.single("video"), function (req, res) {
    const {
        file,
        body: { totalChunks, currentChunk },
    } = req
    const chunkFilename = `${file.originalname}.${currentChunk}`
    const chunkPath = `${CHUNKS_DIR}/${chunkFilename}`
    fs.rename(file.path, chunkPath, (err) => {
        if (err) {
            console.error("Error moving chunk file:", err)
            res.status(500).send("Error uploading chunk")
        } else {
            if (+currentChunk === +totalChunks) {
                // All chunks have been uploaded, assemble them into a single file
                assembleChunks(file.originalname, totalChunks)
                    .then((filePath) => {
                        const data = {
                            videoPath: filePath,
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
