import Videos from "@/components/Videos";
import VideoUploader from "@/components/VideoUploader";
import { VideoContextProvider } from "@/context/VideoContext";

export default async function Home() {
    return (
        <main className="min-h-screen p-24">
            <VideoContextProvider>
                <VideoUploader />
                <Videos />
            </VideoContextProvider>
        </main>
    );
}
