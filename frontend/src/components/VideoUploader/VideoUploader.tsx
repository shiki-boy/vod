import { revalidateTag } from "next/cache";

const VideoUploader = () => {
    async function uploadChunk(
        chunk: Blob,
        totalChunks: number,
        currentChunk: number,
        fileName: string
    ) {
        "use server"
        const formData = new FormData();
        formData.append("video", chunk);
        formData.append("totalChunks", totalChunks.toString());
        formData.append("currentChunk", currentChunk.toString());
        formData.append("fileName", fileName);
        try {
            const response = await fetch("http://localhost:8000/upload", {
                method: "POST",
                body: formData,
                // mode: "no-cors",
            });
            if (!response.ok) {
                throw new Error("Chunk upload failed");
            }
        } catch (error) {
            console.log(error);
            // debugger
        }
    }

    const upload = async (formData: FormData) => {
        "use server";
        console.log(123);
        console.log(formData);
        const file = formData.get("video") as File;
        const chunkSize = 1024 * 1024; // 1MB
        const totalChunks = Math.ceil(file.size / chunkSize);
        let startByte = 0;
        for (let i = 1; i <= totalChunks; i++) {
            const endByte = Math.min(startByte + chunkSize, file.size);
            const chunk = file.slice(startByte, endByte);
            const fileName = file.name.slice(0, file.name.lastIndexOf("."));
            await uploadChunk(chunk, totalChunks, i, fileName);
            startByte = endByte;
        }
        revalidateTag("videos");
    };

    return (
        <form action={upload} className="flex justify-between w-20">
            <input type="file" name="video" />

            <button
                type="submit"
                className="cursor-pointer transition-all bg-blue-500 text-white px-6 py-2 rounded-lg
border-blue-600
border-b-[4px] hover:brightness-110 hover:-translate-y-[1px] hover:border-b-[6px]
active:border-b-[2px] active:brightness-90 active:translate-y-[2px]"
            >
                Upload
            </button>
        </form>
    );
};

export default VideoUploader;
