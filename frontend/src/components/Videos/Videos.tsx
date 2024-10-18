import Link from "next/link";

const Videos = async () => {
    const data = await fetch("http://localhost:8000/videos", {
        cache: "no-cache",
        next: { tags: ["videos"] },
    });
    const videos: string[] = await data.json();

    return (
        <div className="mt-8 flex gap-4 overflow-x-auto max-w-[100%] pb-3">
            {videos.map((v) => (
                <Link href={`/player/${v}`} key={v.slice(5)}>
                    <div className="p-2 rounded-md bg-orange-800 cursor-pointer text-white shadow-sm shadow-orange-100 truncate min-w-[20rem]">
                        {v}
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default Videos;
