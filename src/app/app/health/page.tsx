async function getHealth() {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/health`, {
      cache: "no-store",
    });
    try {
      const data = await res.json();
      return { ok: res.ok, data };
    } catch {
      return { ok: false, data: { error: "Invalid response from /api/health" } };
    }
  }
  
  export default async function HealthPage() {
    const { ok, data } = await getHealth();
  
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">Backend health</h1>
        <pre className={`rounded-xl border p-4 text-sm ${
          ok ? "border-white/10 bg-white/5 text-white/80" : "border-red-500/40 bg-red-500/10 text-red-200"
        }`}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  }
  