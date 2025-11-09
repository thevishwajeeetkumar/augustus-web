import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";

export default function VideosIndexPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Your videos</h1>
      <EmptyState
        title="No videos analyzed yet"
        description="Start by analyzing a YouTube video link."
        action={
          <Button asChild className="rounded-full text-gray-900">
            <Link href="/app/videos/new">Analyze new video</Link>
          </Button>
        }
      />
    </div>
  );
}
