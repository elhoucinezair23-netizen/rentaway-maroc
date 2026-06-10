"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Car, Eye, EyeOff, Upload } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import axios from "axios";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import "@/lib/i18n";

const clientSchema = z.object({
  firstName: z.string().min(2, "Prénom requis"),
  lastName: z.string().min(2, "Nom requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères"),
  phone: z.string().optional(),
});

const agencySchema = clientSchema.extend({
  agencyName: z.string().min(2, "Nom de l'agence requis"),
  registreCommerce: z.string().min(5, "Registre de commerce requis"),
  address: z.string().min(5, "Adresse requise"),
  city: z.string().min(2, "Ville requise"),
});

type ClientForm = z.infer<typeof clientSchema>;
type AgencyForm = z.infer<typeof agencySchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [type, setType] = useState<"client" | "agency">("client");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [assuranceFile, setAssuranceFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AgencyForm>({
    resolver: zodResolver(type === "client" ? clientSchema : agencySchema),
  });

  const onSubmit = async (data: ClientForm | AgencyForm) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v) formData.append(k, v as string);
      });

      if (type === "agency" && assuranceFile) {
        formData.append("assurance", assuranceFile);
      }

      const endpoint =
        type === "client"
          ? "/auth/register/client"
          : "/auth/register/agency";

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`,
        type === "client" ? data : formData,
        {
          headers:
            type === "agency"
              ? { "Content-Type": "multipart/form-data" }
              : {},
        }
      );

      toast.success(
        type === "client"
          ? "Compte créé ! Connectez-vous."
          : "Dossier soumis ! En attente de validation."
      );
      router.push("/login");
    } catch (err: unknown) {
      const msg =
        axios.isAxiosError(err)
          ? err.response?.data?.error
          : "Erreur d'inscription";
      toast.error(msg || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="max-w-lg w-full mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.svg" alt="RentaWay Maroc" className="h-12 w-auto" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{t("auth.creerCompte")}</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Type selection */}
          <div className="flex rounded-xl border border-gray-200 p-1 mb-6">
            <button
              onClick={() => setType("client")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                type === "client"
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Client
            </button>
            <button
              onClick={() => setType("agency")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                type === "agency"
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Agence de location
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Prénom"
                placeholder="Mohammed"
                error={errors.firstName?.message}
                required
                {...register("firstName")}
              />
              <Input
                label="Nom"
                placeholder="El Alami"
                error={errors.lastName?.message}
                required
                {...register("lastName")}
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="vous@exemple.com"
              error={errors.email?.message}
              required
              {...register("email")}
            />

            <Input
              label="Téléphone"
              type="tel"
              placeholder="+212 6XX XXX XXX"
              error={errors.phone?.message}
              {...register("phone")}
            />

            <Input
              label="Mot de passe"
              type={showPassword ? "text" : "password"}
              placeholder="Minimum 8 caractères"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="pointer-events-auto text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.password?.message}
              required
              {...register("password")}
            />

            {/* Agency fields */}
            {type === "agency" && (
              <>
                <hr className="border-gray-100" />
                <p className="text-sm font-medium text-gray-700">Informations de l&apos;agence</p>

                <Input
                  label="Nom de l'agence"
                  placeholder="Auto Rental Marrakech"
                  error={(errors as { agencyName?: { message?: string } }).agencyName?.message}
                  required
                  {...register("agencyName")}
                />

                <Input
                  label="Registre de commerce"
                  placeholder="RC12345"
                  error={(errors as { registreCommerce?: { message?: string } }).registreCommerce?.message}
                  required
                  {...register("registreCommerce")}
                />

                <Input
                  label="Adresse"
                  placeholder="123 Avenue Mohammed V"
                  error={(errors as { address?: { message?: string } }).address?.message}
                  required
                  {...register("address")}
                />

                <Input
                  label="Ville"
                  placeholder="Marrakech"
                  error={(errors as { city?: { message?: string } }).city?.message}
                  required
                  {...register("city")}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Attestation d&apos;assurance <span className="text-red-500">*</span>
                  </label>
                  <label className="flex items-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-4 cursor-pointer hover:border-primary-400 transition-colors">
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      {assuranceFile ? assuranceFile.name : "Cliquez pour uploader (PDF, max 5MB)"}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => setAssuranceFile(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </>
            )}

            <Button type="submit" loading={loading} fullWidth size="lg">
              {type === "client" ? "Créer mon compte" : "Soumettre ma demande"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà un compte ?{" "}
          <Link href="/login" className="text-primary-600 font-medium hover:underline">
            {t("auth.seConnecter")}
          </Link>
        </p>
      </div>
    </div>
  );
}
