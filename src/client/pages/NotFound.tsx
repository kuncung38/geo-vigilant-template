import { Link } from "react-router-dom";

interface NotFoundProps {
  code?: string;
  title?: string;
  detail?: string;
}

export function NotFound({
  code = "404",
  title = "Halaman tidak ditemukan",
  detail = "Alamat yang Anda buka tidak ada di sistem pemantauan ini.",
}: NotFoundProps) {
  return (
    <div className="animate-fade-in flex min-h-[60vh] items-center justify-center">
      <div className="max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-10 text-center shadow-sm">
        <p className="font-data-mono text-5xl font-bold text-outline-variant">
          {code}
        </p>
        <h1 className="font-headline-md mt-4 text-2xl font-bold text-on-surface">
          {title}
        </h1>
        <p className="font-body-md mt-2 text-on-surface-variant">{detail}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="rounded-lg bg-primary-container px-5 py-2.5 font-label-caps text-xs uppercase tracking-wider text-white transition-colors hover:opacity-90"
          >
            Kembali ke dasbor
          </Link>
          <Link
            to="/map"
            className="rounded-lg border border-outline-variant px-5 py-2.5 font-label-caps text-xs uppercase tracking-wider text-on-surface transition-colors hover:border-primary hover:bg-surface-container-low"
          >
            Lihat semua klaster
          </Link>
        </div>
      </div>
    </div>
  );
}
