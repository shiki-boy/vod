import Hls from "hls.js";
import Plyr from "plyr";
import React, { useEffect, useRef, useState } from "react";

const defaults: { options: Plyr.Options } = {
    options: {
        controls: [
            "rewind",
            "play",
            "fast-forward",
            "progress",
            "current-time",
            "duration",
            "mute",
            "volume",
            "settings",
            "fullscreen",
        ],
        i18n: {
            restart: "Restart",
            rewind: "Rewind {seektime}s",
            play: "Play",
            pause: "Pause",
            fastForward: "Forward {seektime}s",
            seek: "Seek",
            seekLabel: "{currentTime} of {duration}",
            played: "Played",
            buffered: "Buffered",
            currentTime: "Current time",
            duration: "Duration",
            volume: "Volume",
            mute: "Mute",
            unmute: "Unmute",
            enableCaptions: "Enable captions",
            disableCaptions: "Disable captions",
            download: "Download",
            enterFullscreen: "Enter fullscreen",
            exitFullscreen: "Exit fullscreen",
            frameTitle: "Player for {title}",
            captions: "Captions",
            settings: "Settings",
            menuBack: "Go back to previous menu",
            speed: "Speed",
            normal: "Normal",
            quality: "Quality",
            loop: "Loop",
        },
    },
    // sources: {
    //     type: "video",
    //     sources: [],
    // },
};

const Player = ({ videoSrc }: { videoSrc: string }) => {
    const [player, setPlayer] = useState<Plyr | null>(null);

    const videoRef = useRef(null);
    const hlsRef = useRef(new Hls());

    const updateQuality = (newQuality: number) => {
        const selectedLevel = hlsRef.current.levels.findIndex(
            (level) => level.height === newQuality
        );

        hlsRef.current.currentLevel = selectedLevel;
    };

    useEffect(() => {
        if (videoRef.current) {
            const videoEl = videoRef.current;

            if (Hls.isSupported()) {
                hlsRef.current.loadSource(videoSrc);

                hlsRef.current.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                    const availableQualtities = hlsRef.current.levels.map(
                        (el) => el.height
                    );

                    defaults.options.quality = {
                        default: availableQualtities[0],
                        options: availableQualtities,
                        forced: true,
                        onChange: updateQuality,
                    };

                    hlsRef.current.attachMedia(videoEl);

                    const _player = new Plyr(
                        videoEl,
                        defaults.options
                    );

                    setPlayer(_player);
                });
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
