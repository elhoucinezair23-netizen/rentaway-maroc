"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Upload, Loader2, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import toast from "react-hot-toast";

const schema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function ClientProfilePage() {
  const { data: session } = useSession();
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [profile, setProfile] = useState<{
    cinPath?: string; permisPath?: string; isVerified?: boolean;
  }>({});

  const sessionUser = session?.user as {
    name?: string; email?: string; id?: string;
  } | undefined;

  const [firstName, lastName] = (sessionUser?.name || " ").split(" ");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: firstName || "", lastName: lastName || "" },
  });

  useEffect(() => {
    api.get("/auth/me")
      .then((r) => setProfile(r.data))
      .catch(() => {});
  }, []);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await api.patch("/auth/me", data);
      toast.success("Profil mis à jour");
    } catch {
      toast.error("Erreur de mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const uploadDocuments = async (e: React.ChangeEvent<HTMLInputElement>, type: "cin" | "permis") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    const fd = new FormData();
    fd.append(type, file);
    try {
      const res = await api.post("/auth/upload-documents", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setProfile((p) => ({ ...p, ...res.data }));
      toast.success("Document uploadé");
    } catch {
      toast.error("Erreur d'upload");
    } finally {
      setUploadingDoc(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>

      {/* Profile form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{sessionUser?.name}</p>
            <p className="text-sm text-gray-500">{sessionUser?.email}</p>
            {profile.isVerified && (
              <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                <CheckCircle className="h-3.5 w-3.5" />
                Compte vérifié
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prénom" error={errors.firstName?.message} {...register("firstName")} />
            <Input label="Nom" error={errors.lastName?.message} {...register("lastName")} />
          </div>
          <Input label="Email" type="email" value={sessionUser?.email || ""} disabled />
          <Input label="Téléphone" type="tel" placeholder="+212 6XX XXX XXX" {...register("phone")} />
          <Button type="submit" loading={saving}>Sauvegarder les modifications</Button>
        </form>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Documents d&apos;identité</h2>
        <p className="text-sm text-gray-500 mb-4">
          Ces documents sont nécessaires pour louer certains véhicules. Ils sont traités de manière sécurisée.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: "cin" as const, label: "CIN / Passeport", field: "cinPath" },
            { key: "permis" as const, label: "Permis de conduire", field: "permisPath" },
          ].map(({ key, label, field }) => (
            <div key={key} className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:border-primary-400 transition-colors">
              <label className="cursor-pointer flex flex-col items-center gap-2">
                {profile[field as keyof typeof profile] ? (
                  <>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                    <span className="text-sm font-medium text-green-600">Uploadé ✓</span>
                    <span className="text-xs text-gray-400">Cliquer pour remplacer</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-300" />
                    <span className="text-sm font-medium text-gray-700">{label}</span>
                    <span className="text-xs text-gray-400">PDF, JPG ou PNG, max 5MB</span>
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => uploadDocuments(e, key)}
                />
              </label>
            </div>
          ))}
        </div>

        {uploadingDoc && (
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Upload en cours...
          </div>
        )}
      </div>
    </div>
  );
}
