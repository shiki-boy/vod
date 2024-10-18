import { JSONFilePreset } from "lowdb/node"
import fs from "node:fs/promises"
import path from "node:path"

const directories = ["uploads", "videos", "chunks"]

for (const dir of directories) {
    for (const file of await fs.readdir(dir)) {
        await fs.rm(path.join(dir, file), { recursive: true })
    }
}

const db = await JSONFilePreset("../db.json", {})

db.data.videos = []
await db.write()
