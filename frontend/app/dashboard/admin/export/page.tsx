"use client";

import { useState } from "react";
import { Download, Users, Calendar, Building2, Target, Loader2 } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

type ExportType = "users" | "reservations" | "agencies" | "prospects";

const EXPORTS: { key: ExportType; label: string; description: string; Icon: React.ElementType; color: string }[] = [
  { key: "users",        label: "Utilisateurs",   description: "Tous les comptes clients, loueurs et admins", Icon: Users,     color: "primary" },
  { key: "reservations", label: "Réservations",   description: "Historique complet des locations",            Icon: Calendar,  color: "secondary" },
  { key: "agencies",     label: "Agences",        description: "Annuaire de toutes les agences (avec stats)", Icon: Building2, color: "accent" },
  { key: "prospects",    label: "Prospects",      description: "Liste des agences scrapées + statuts",        Icon: Target,    color: "primary" },
];

const COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  primary:   { bg: "bg-primary-50",   text: "text-primary-600",   ring: "ring-primary-100" },
  secondary: { bg: "bg-secondary-50", text: "text-secondary-600", ring: "ring-secondary-100" },
  accent:    { bg: "bg-accent-50",    text: "text-accent-600",    ring: "ring-accent-100" },
};

export default function AdminExportPage() {
  const [loadingKey, setLoadingKey] = useState<ExportType | null>(null);

  async function handleExport(key: ExportType) {
    setLoadingKey(key);
    try {
      const res = await api.get(`/admin/export/${key}`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().split("T")[0];
      a.download = `${key}_${date}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${key}.csv téléchargé`);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Erreur d'export");
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-700">Export de données</h1>
        <p className="text-sm text-gray-500 mt-1">
          Téléchargez les données de la plateforme au format CSV (Excel-compatible).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {EXPORTS.map(({ key, label, description, Icon, color }) => {
          const c = COLORS[color];
          const isLoading = loadingKey === key;
          return (
            <div
              key={key}
              className="bg-white border border-gray-100 rounded-xl p-5 shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 rounded-xl ${c.bg} flex items-center justify-center ring-4 ${c.ring}`}>
                  <Icon className={`h-6 w-6 ${c.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-secondary-700">{label}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{description}</p>
                  <button
                    onClick={() => handleExport(key)}
                    disabled={isLoading}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary-700 text-white text-sm font-semibold hover:bg-secondary-800 active:scale-[0.97] disabled:opacity-60 transition"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Génération…
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" /> Exporter en CSV
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-secondary-50 border border-secondary-100 rounded-xl p-4 text-xs text-secondary-700">
        <p>
          <strong>Note :</strong> les exports incluent toutes les données de la plateforme. Les fichiers
          sont encodés en UTF-8 avec BOM pour ouverture directe dans Excel. Manipulez ces données
          conformément à la <a href="/confidentialite" className="underline">politique de confidentialité</a>.
        </p>
      </div>
    </div>
  );
}
