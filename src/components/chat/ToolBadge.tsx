import { Badge } from "@/components/ui/badge";

type Props = { tool?: string | null };

export function ToolBadge({ tool }: Props) {
  if (!tool) return null;
  const label = tool.toLowerCase().includes("search") ? "Web" : tool.toUpperCase();
  return <Badge className="bg-white/10 text-white border-white/20">{label}</Badge>;
}
