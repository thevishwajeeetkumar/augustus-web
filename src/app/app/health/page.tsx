// Force dynamic rendering to prevent build-time fetch
export const dynamic = 'force-dynamic';

async function getHealth() {
  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    if (!siteUrl) {
      return { ok: false, data: { error: "NEXT_PUBLIC_SITE_URL not configured" } };
    }
    
    const res = await fetch(`${siteUrl}/api/health`, {
      cache: "no-store",
    });
    try {
      const data = await res.json();
      return { ok: res.ok, data };
    } catch {
      return { ok: false, data: { error: "Invalid response from /api/health" } };
    }
  } catch (err) {
    return { 
      ok: false, 
      data: { 
        error: err instanceof Error ? err.message : "Failed to fetch health status" 
      } 
    };
  }
}
  
export default async function HealthPage() {
  const { ok, data } = await getHealth();

  return (
    <div className="relative space-y-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute -top-28 right-[18%] h-[420px] w-[420px] bg-[radial-gradient(circle,rgba(95,139,255,0.24),transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-32%] left-[20%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(122,93,255,0.2),transparent_70%)] blur-[110px]" />
      </div>
      <header className="relative z-10 space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-white/55">
          Status
        </span>
        <h1 className="text-3xl font-semibold">Backend health</h1>
        <p className="max-w-2xl text-sm text-white/65">
          We proxy AugustuS Cloud to check transcript, embedding, and agent pipelines. Refresh to re-run diagnostics.
        </p>
      </header>
      <div
        className={`relative z-10 overflow-hidden rounded-3xl border p-6 text-sm shadow-[0_24px_70px_rgba(15,23,42,0.55)] backdrop-blur ${
          ok
            ? "border-emerald-400/35 bg-emerald-500/10 text-emerald-100"
            : "border-red-400/35 bg-red-500/10 text-red-100"
        }`}
      >
        <pre className="overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}