"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authPublicApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setLoading(true);
    try {
      await authPublicApi.forgotPassword(email);
      setSent(true);
    } catch {
      // Toujours afficher succès — ne révèle pas si l'email existe
      setSent(true);
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
          <h1 className="text-2xl font-bold text-secondary-700">Mot de passe oublié ?</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Saisissez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
              <p className="text-gray-700 font-medium">Email envoyé si le compte existe.</p>
              <p className="text-sm text-gray-500">
                Vérifiez votre boîte de réception (et vos spams). Le lien expire dans 1 heure.
              </p>
              <Link href="/login">
                <Button variant="outline" fullWidth>
                  <ArrowLeft className="h-4 w-4" /> Retour à la connexion
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                leftIcon={<Mail className="h-4 w-4" />}
                required
              />
              <Button type="submit" loading={loading} fullWidth size="lg">
                Réinitialiser
              </Button>
              <Link href="/login" className="block text-center text-sm text-primary-600 hover:underline mt-3">
                <ArrowLeft className="h-3 w-3 inline mr-1" /> Retour à la connexion
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
