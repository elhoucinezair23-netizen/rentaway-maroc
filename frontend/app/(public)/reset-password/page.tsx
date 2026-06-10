"use client";

export const dynamic = "force-dynamic";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Lock, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authPublicApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ResetPasswordInner />
    </Suspense>
  );
}

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      toast.error("Lien invalide ou expiré");
      return;
    }
    if (password.length < 8) {
      toast.error("Mot de passe trop court (8 caractères min)");
      return;
    }
    if (password !== confirm) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);
    try {
      await authPublicApi.resetPassword(token, password);
      setDone(true);
      toast.success("Mot de passe réinitialisé !");
      setTimeout(() => router.push("/login"), 2000);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Erreur. Lien expiré ?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-md w-full mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <Image src="/logo.svg" alt="RentaWay Maroc" width={170} height={46} className="h-10 w-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-secondary-700">Nouveau mot de passe</h1>
          <p className="text-gray-500 mt-1 text-sm">Choisissez un nouveau mot de passe pour votre compte.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-gray-700 font-medium">Mot de passe mis à jour</p>
              <p className="text-sm text-gray-500">Redirection vers la page de connexion…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nouveau mot de passe"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                hint="8 caractères minimum"
                required
              />
              <Input
                label="Confirmer"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                required
              />
              <Button type="submit" loading={loading} fullWidth size="lg">
                Valider
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
