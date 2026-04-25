export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-8 font-sans dark:bg-black">
      <section className="w-full max-w-3xl rounded-lg bg-white p-8 shadow-sm dark:bg-zinc-950">
        <div className="space-y-4">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Polymarket Intelligence
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Market Dashboard
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Ingest active Polymarket markets, store snapshots, expose API
            routes, and generate a short AI trend report from the data.
          </p>
        </div>
      </section>
    </main>
  );
}
