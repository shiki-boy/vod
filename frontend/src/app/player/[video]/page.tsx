"use client";

import dynamic from "next/dynamic";

const Player = dynamic(() => import("@/components/Player"), {
    ssr: false,
});

export default function Page({ params }: { params: { video: string } }) {
    const { video } = params;
    const videoSrc = `http://localhost:8000/static/${video}/index.m3u8`;

    return <Player videoSrc={videoSrc} />;
}
