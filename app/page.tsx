import Link from "next/link";

export default async function Home() {
  "use cache";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#e2f2ff,transparent_35%),linear-gradient(180deg,#f7fbff_0%,#eef4fb_45%,#f9fafb_100%)] text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10 sm:px-10">
        <header className="flex items-center justify-between gap-4 py-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-sky-700">Amin Wallet</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Server-rendered money tracking for one human.</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-white"
            >
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Create account
            </Link>
          </div>
        </header>

        <div className="grid flex-1 gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-8">
            <span className="inline-flex rounded-full border border-sky-200 bg-white/80 px-4 py-1 text-sm font-medium text-sky-700 shadow-sm">
              Next.js 16 + Clerk + Drizzle + PlanetScale Postgres
            </span>
            <div className="space-y-4">
              <h2 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                Personal finance without the client-side sprawl.
              </h2>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Amin Wallet keeps reads on the server, mutations as server actions, and your data scoped by Clerk-backed
                ownership. The result is faster page delivery, simpler security boundaries, and a database model that
                can actually grow with you.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FeatureCard title="Server Components" copy="Pages render close to the data source and keep secrets off the client." />
              <FeatureCard title="PlanetScale Postgres" copy="Branch-friendly schema evolution with tracked Drizzle migrations." />
              <FeatureCard title="Clerk ownership" copy="Every wallet belongs to a real signed-in user from day one." />
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="rounded-full bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-600/20 transition hover:bg-sky-500"
              >
                Open dashboard
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full border border-slate-300 bg-white/70 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
              >
                Start with Clerk
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
            <div className="space-y-4 rounded-[1.5rem] bg-slate-950 p-6 text-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Preview</p>
                  <p className="text-lg font-semibold">Server-rendered dashboard shell</p>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Live data
                </span>
              </div>

              <div className="grid gap-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Wallets</p>
                  <p className="mt-3 text-2xl font-semibold text-white">Per-user ownership</p>
                  <p className="mt-1 text-slate-400">Scoped through `wallets.user_id`, enforced entirely on the server.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Transfers</p>
                  <p className="mt-3 text-2xl font-semibold text-white">Self-contained amounts</p>
                  <p className="mt-1 text-slate-400">Live transfers persist source, target, and fee amounts directly.</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Caching</p>
                  <p className="mt-3 text-2xl font-semibold text-white">Only where it helps</p>
                  <p className="mt-1 text-slate-400">Reference data is cached. User money data stays request-scoped.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, copy }: { title: string; copy: string }) {
  return (
    <article className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{copy}</p>
    </article>
  );
}

