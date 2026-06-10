"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { publicApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function update(k: keyof typeof form, v: string) {
    setForm({ ...form, [k]: v });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.name.length < 2 || !form.email.includes("@") || form.subject.length < 2 || form.message.length < 10) {
      toast.error("Veuillez remplir tous les champs (message ≥ 10 caractères)");
      return;
    }
    setLoading(true);
    try {
      await publicApi.contact(form);
      setSent(true);
      toast.success("Message envoyé !");
    } catch (e: unknown) {
      toast.error((e as Error).message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <section className="bg-secondary-700 text-white py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl lg:text-4xl font-bold">Contactez-nous</h1>
          <p className="mt-3 text-gray-200">
            Une question ? Une suggestion ? Notre équipe vous répond sous 24h.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coordonnées */}
        <aside className="space-y-4">
          <h2 className="text-lg font-bold text-secondary-700">Coordonnées</h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-soft p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Mail className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Email</p>
                <p className="text-sm font-medium text-gray-800">contact@rentaway.ma</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <Phone className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Téléphone</p>
                <p className="text-sm font-medium text-gray-800">+212 5 22 00 00 00</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Adresse</p>
                <p className="text-sm font-medium text-gray-800">Casablanca, Maroc</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Pour une demande commerciale (devenir loueur, partenariat),{" "}
            <a href="/rejoindre-en-tant-que-loueur" className="text-primary-600 underline">
              utilisez le formulaire dédié
            </a>.
          </p>
        </aside>

        {/* Formulaire */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-card p-8">
          {sent ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto" />
              <h2 className="text-xl font-bold text-secondary-700">Message envoyé !</h2>
              <p className="text-gray-500">
                Merci, {form.name.split(" ")[0]}. Nous vous répondons sous 24h à <strong>{form.email}</strong>.
              </p>
              <Button variant="outline" onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }}>
                Envoyer un autre message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Nom complet"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="Votre nom"
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="vous@exemple.com"
                  required
                />
              </div>
              <Input
                label="Sujet"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                placeholder="Ex : Question sur ma réservation"
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  rows={6}
                  placeholder="Décrivez votre demande en détail…"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-400"
                  required
                />
                <p className="mt-1 text-xs text-gray-400">{form.message.length} / 5000 caractères</p>
              </div>
              <Button type="submit" loading={loading} size="lg" fullWidth>
                <Send className="h-4 w-4" />
                Envoyer le message
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
