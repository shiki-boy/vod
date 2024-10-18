import Hls from "hls.js";
import Plyr from "plyr";
import React, { useEffect, useRef, useState } from "react";

const Player = ({ videoSrc }: { videoSrc: string }) => {
    const [player, setPlayer] = useState<Plyr | null>(null);

    const videoRef = useRef(null);
    const hlsRef = useRef(new Hls());

    useEffect(() => {
        if (videoRef.current) {
            const videoEl = videoRef.current;

            if (Hls.isSupported()) {
                const player = new Plyr(videoEl, {});

                console.log({ videoSrc });
                hlsRef.current.loadSource(videoSrc);
                hlsRef.current.attachMedia(videoEl);
                setPlayer(player);
            }
        }
    }, [videoSrc]);

    if (!videoSrc) {
        return;
    }

    return (
        <div className="w-[75vw] m-auto">
            <video ref={videoRef} className="js-plyr plyr" src=""></video>
        </div>
    );
};

export default Player;
