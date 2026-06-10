"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Mail, Send, RefreshCw, Loader2, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { adminEmailApi } from "@/lib/api";

const EMAIL_TYPES = [
  { value: "welcome",        label: "Bienvenue (nouveau client)",                emoji: "🎉" },
  { value: "reservation",    label: "Confirmation de réservation (client)",     emoji: "✅" },
  { value: "agency",         label: "Notification de réservation (loueur)",     emoji: "📅" },
  { value: "reset",          label: "Réinitialisation de mot de passe",          emoji: "🔐" },
  { value: "contact",        label: "Message de contact (vers admin)",           emoji: "✉️" },
  { value: "contactConfirm", label: "Accusé de réception de contact (visiteur)", emoji: "📨" },
] as const;

type LogEntry = {
  id: string;
  type: string;
  to: string;
  status: "sent" | "failed";
  error?: string;
  sentAt: string;
};

export default function AdminEmailsPage() {
  const [type, setType] = useState<string>("welcome");
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loadingLog, setLoadingLog] = useState(false);

  async function refreshLog() {
    setLoadingLog(true);
    try {
      const { data } = await adminEmailApi.log();
      setLog(data.items || []);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setLoadingLog(false);
    }
  }

  useEffect(() => {
    refreshLog();
  }, []);

  async function send() {
    if (!to.includes("@")) {
      toast.error("Adresse email invalide");
      return;
    }
    setSending(true);
    const promise = adminEmailApi.test(type, to);
    toast.promise(promise, {
      loading: "Envoi en cours…",
      success: "Email envoyé ✓",
      error: (e: Error) => e.message || "Échec de l'envoi",
    });
    try {
      await promise;
    } catch {
      // already toasted
    } finally {
      setSending(false);
      refreshLog();
    }
  }

  const typeLabel = (v: string) =>
    EMAIL_TYPES.find((t) => t.value === v)?.label || v;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-secondary-700 flex items-center gap-2">
          <Mail className="h-6 w-6 text-primary-600" />
          Tester les emails
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Envoyer un email factice à une adresse de test pour vérifier le template et la configuration SMTP.
        </p>
      </div>

      {/* Configuration SMTP info */}
      <div className="bg-secondary-50 border border-secondary-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-secondary-700">Configuration SMTP attendue</p>
        <p className="text-xs text-secondary-600 mt-1">
          Définir dans <code className="font-mono bg-white px-1 py-0.5 rounded">backend/.env</code> :
          <code className="font-mono ml-1">SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, ADMIN_EMAIL</code>.
        </p>
        <p className="text-xs text-secondary-600 mt-1">
          Gmail : 2FA activée + générer un <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-primary-600 underline">mot de passe d&apos;application</a>.
        </p>
      </div>

      {/* Formulaire d'envoi */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft">
        <h2 className="font-semibold text-gray-900 mb-4">Envoyer un email de test</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Type d&apos;email
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={sending}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              {EMAIL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.emoji} {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Adresse de destination
            </label>
            <input
              type="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="vous@gmail.com"
              disabled={sending}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
        </div>

        <button
          onClick={send}
          disabled={sending || !to}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Envoyer l&apos;email de test
        </button>
      </div>

      {/* Log */}
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">Derniers envois</h2>
            <p className="text-xs text-gray-500 mt-0.5">Les 10 dernières tentatives (en mémoire, perdues au redémarrage)</p>
          </div>
          <button
            onClick={refreshLog}
            disabled={loadingLog}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-xs font-medium text-gray-700 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loadingLog ? "animate-spin" : ""}`} />
            Rafraîchir
          </button>
        </div>

        {log.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            Aucun email envoyé pour le moment.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {log.map((entry) => (
              <div key={entry.id} className="py-3 flex items-start gap-3">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    entry.status === "sent"
                      ? "bg-green-100 text-green-600"
                      : "bg-primary-100 text-primary-600"
                  }`}
                >
                  {entry.status === "sent" ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-gray-900 truncate">
                      {typeLabel(entry.type)}
                    </span>
                    <span className="text-xs text-gray-400">→</span>
                    <span className="text-sm text-secondary-600 font-mono truncate">{entry.to}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">
                      {new Date(entry.sentAt).toLocaleString("fr-MA")}
                    </span>
                    {entry.error && (
                      <span className="text-xs text-primary-600 truncate" title={entry.error}>
                        — {entry.error}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
