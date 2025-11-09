import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";

/**
 * When you expose /api/sessions (proxying FastAPI), replace this with a real fetch
 * and render a grid of <SessionCard /> items.
 */
export default function SessionsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Sessions</h1>
      <EmptyState
        title="No sessions to show"
        description="Once you start chatting with a video, your sessions will appear here."
        action={
          <Button asChild className="rounded-full text-gray-900">
            <Link href="/app/videos/new">Analyze a video</Link>
          </Button>
        }
      />
    </div>
  );
}
