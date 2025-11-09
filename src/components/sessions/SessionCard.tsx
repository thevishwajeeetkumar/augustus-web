import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  sessionId: string;
  videoId: string;
  title?: string;
  lastActivity?: string; // ISO or readable
};

export function SessionCard({ sessionId, videoId, title, lastActivity }: Props) {
  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <Link href={`/app/videos/${videoId}`} className="block">
      <Card className="border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
        <CardContent className="p-3">
          <div className="flex gap-3">
            <Image
              src={thumb}
              alt={title || `Thumbnail for ${videoId}`}
              width={224}
              height={126}
              className="h-16 w-28 rounded-md object-cover"
              priority={false}
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">
                {title || `Session ${sessionId.slice(0, 8)}…`}
              </div>
              <div className="mt-1 text-xs text-white/60">
                Video: {videoId}
              </div>
              {lastActivity ? (
                <div className="text-[10px] text-white/50">
                  Last activity: {formatDate(lastActivity)}
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function formatDate(d: string) {
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleString();
}
