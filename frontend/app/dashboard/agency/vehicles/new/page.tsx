"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Upload, X, Loader2, ArrowLeft } from "lucide-react";
import type { VehicleCategory } from "@/types";

const VEHICLE_CATEGORY_VALUES = ["VOITURE", "MOTO", "BATEAU", "JETSKI"] as const;
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { vehicleApi } from "@/lib/api";
import toast from "react-hot-toast";
import Image from "next/image";

const schema = z.object({
  category: z.enum(VEHICLE_CATEGORY_VALUES),
  title: z.string().min(5, "Titre trop court"),
  description: z.string().min(20, "Description trop courte"),
  pricePerDay: z.coerce.number().positive("Prix requis"),
  pricePerHour: z.coerce.number().positive().optional().or(z.literal("")),
  caution: z.coerce.number().positive("Caution requise"),
  city: z.string().min(2, "Ville requise"),
  requiredLicense: z.string().min(1, "Permis requis"),
  // Specs fields
  marque: z.string().optional(),
  modele: z.string().optional(),
  annee: z.coerce.number().optional().or(z.literal("")),
  places: z.coerce.number().optional().or(z.literal("")),
  carburant: z.string().optional(),
  boite: z.enum(["automatique", "manuelle", ""]).optional(),
});

type FormData = z.infer<typeof schema>;

const CATEGORIES: { value: VehicleCategory; label: string }[] = [
  { value: "VOITURE", label: "Voiture" },
  { value: "MOTO", label: "Moto" },
  { value: "BATEAU", label: "Bateau" },
  { value: "JETSKI", label: "Jet-ski" },
];

const LICENSE_OPTIONS: Record<VehicleCategory, string[]> = {
  VOITURE: ["B"],
  MOTO: ["A", "A2", "A1"],
  BATEAU: ["Permis côtier", "Permis hauturier", "Sans permis"],
  JETSKI: ["Permis bateau", "Aucun"],
};

export default function NewVehiclePage() {
  const router = useRouter();
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "VOITURE" },
  });

  const category = watch("category");

  const handleImageAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 8 - images.length);
    setImages((prev) => [...prev, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onloadend = () => setPreviews((p) => [...p, reader.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeImage = (i: number) => {
    setImages((p) => p.filter((_, idx) => idx !== i));
    setPreviews((p) => p.filter((_, idx) => idx !== i));
  };

  const onSubmit = async (data: FormData) => {
    if (images.length === 0) {
      toast.error("Ajoutez au moins une photo");
      return;
    }
    setLoading(true);
    try {
      const specs: Record<string, unknown> = {};
      if (data.marque) specs.marque = data.marque;
      if (data.modele) specs.modele = data.modele;
      if (data.annee) specs.annee = data.annee;
      if (data.places) specs.places = data.places;
      if (data.carburant) specs.carburant = data.carburant;
      if (data.boite) specs.boite = data.boite;

      const fd = new FormData();
      fd.append("category", data.category);
      fd.append("title", data.title);
      fd.append("description", data.description);
      fd.append("pricePerDay", String(data.pricePerDay));
      if (data.pricePerHour) fd.append("pricePerHour", String(data.pricePerHour));
      fd.append("caution", String(data.caution));
      fd.append("city", data.city);
      fd.append("requiredLicense", data.requiredLicense);
      fd.append("specs", JSON.stringify(specs));
      images.forEach((img) => fd.append("images", img));

      await vehicleApi.create(fd);
      toast.success("Véhicule ajouté avec succès !");
      router.push("/dashboard/agency/vehicles");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ajouter un véhicule</h1>
          <p className="text-sm text-gray-500">Remplissez les informations de votre véhicule</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Category */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Catégorie</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATEGORIES.map(({ value, label }) => (
              <label
                key={value}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  category === value
                    ? "border-primary-600 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <input type="radio" value={value} {...register("category")} className="sr-only" />
                <span className="text-sm font-medium text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Photos <span className="text-sm text-gray-400 font-normal">(max 8)</span></h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {previews.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden group">
                <Image src={src} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < 8 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-primary-400 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors">
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-xs text-gray-400">Ajouter</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAdd} />
              </label>
            )}
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Informations générales</h2>
          <Input
            label="Titre de l'annonce"
            placeholder="Ex : Toyota Corolla 2022 — Casablanca"
            error={errors.title?.message}
            required
            {...register("title")}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Décrivez votre véhicule, son état, les équipements inclus..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
              {...register("description")}
            />
            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
          </div>
          <Input
            label="Ville"
            placeholder="Casablanca"
            error={errors.city?.message}
            required
            {...register("city")}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Permis requis <span className="text-red-500">*</span>
            </label>
            <select
              {...register("requiredLicense")}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
            >
              <option value="">Sélectionner</option>
              {LICENSE_OPTIONS[category as VehicleCategory]?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Tarification</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prix / jour (MAD)"
              type="number"
              min={1}
              placeholder="350"
              error={errors.pricePerDay?.message}
              required
              {...register("pricePerDay")}
            />
            <Input
              label="Prix / heure (MAD) — optionnel"
              type="number"
              min={1}
              placeholder="80"
              {...register("pricePerHour")}
            />
          </div>
          <Input
            label="Caution / dépôt de garantie (MAD)"
            type="number"
            min={0}
            placeholder="5000"
            error={errors.caution?.message}
            required
            {...register("caution")}
          />
        </div>

        {/* Specs (Voiture) */}
        {category === "VOITURE" && (
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Caractéristiques</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Marque" placeholder="Toyota" {...register("marque")} />
              <Input label="Modèle" placeholder="Corolla" {...register("modele")} />
              <Input label="Année" type="number" placeholder="2022" {...register("annee")} />
              <Input label="Nombre de places" type="number" placeholder="5" {...register("places")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Boîte de vitesse</label>
                <select {...register("boite")} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">Sélectionner</option>
                  <option value="automatique">Automatique</option>
                  <option value="manuelle">Manuelle</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Carburant</label>
                <select {...register("carburant")} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                  <option value="">Sélectionner</option>
                  <option value="Essence">Essence</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybride">Hybride</option>
                  <option value="Électrique">Électrique</option>
                </select>
              </div>
            </div>
          </div>
        )}

        <Button type="submit" loading={loading} size="lg" fullWidth>
          {loading ? "Publication en cours..." : "Publier l'annonce"}
        </Button>
      </form>
    </div>
  );
}
