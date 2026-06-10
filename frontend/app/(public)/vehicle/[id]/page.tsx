import { Metadata } from "next";
import { notFound } from "next/navigation";
import { VehicleDetail } from "@/components/vehicle/VehicleDetail";

interface Props {
  params: { id: string };
}

async function getVehicle(id: string) {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/vehicles/${id}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const vehicle = await getVehicle(params.id);
  if (!vehicle) return { title: "Véhicule introuvable" };

  return {
    title: `${vehicle.title} — ${vehicle.city}`,
    description: vehicle.description.substring(0, 160),
    openGraph: {
      title: vehicle.title,
      description: vehicle.description.substring(0, 160),
      images: vehicle.images?.[0] ? [vehicle.images[0]] : [],
    },
  };
}

export default async function VehicleDetailPage({ params }: Props) {
  const vehicle = await getVehicle(params.id);
  if (!vehicle) notFound();

  return <VehicleDetail vehicle={vehicle} />;
}
