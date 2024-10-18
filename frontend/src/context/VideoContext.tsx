"use client"

import React, { createContext, ReactNode, useContext, useState } from "react";

export interface VideoContextType {
    videoSrc: string;
    setVideoSrc: React.Dispatch<string>;
}

const VideoContext = createContext<VideoContextType | object>({});

export const VideoContextProvider = ({
    children,
}: {
    children: ReactNode[];
}) => {
    const [videoSrc, setVideoSrc] = useState("");

    return (
        <VideoContext.Provider value={{ videoSrc, setVideoSrc }}>
            {children}
        </VideoContext.Provider>
    );
};

export default VideoContext;

export const useVideoContext = () =>
    useContext(VideoContext) as VideoContextType;
