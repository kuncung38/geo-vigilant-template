export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 flex flex-col items-center justify-center">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          GEO-VIGILANT
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Landslide Monitoring & Telemetry Dashboard
        </p>
      </header>
      <main className="w-full max-w-4xl rounded-xl bg-slate-900 border border-slate-800 p-6 shadow-xl text-center">
        <p className="text-slate-300">
          System Ready. Awaiting sensor telemetry...
        </p>
      </main>
    </div>
  );
}
