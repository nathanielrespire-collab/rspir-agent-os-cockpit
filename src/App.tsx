import { t } from "@/lib/i18n";

/** Placeholder d'amorce. BUILD-000 ajoute son marqueur; BUILD-001 remplace par le shell complet. */
export default function App() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="rounded-card border border-line bg-bg-1 px-8 py-6 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-laiton">rspir</p>
        <h1 className="mt-2 text-xl font-semibold">{t("app_title")}</h1>
        <p className="mt-2 font-mono text-xs text-tx-3">{t("bootstrap_marker")}</p>
      </div>
    </main>
  );
}
