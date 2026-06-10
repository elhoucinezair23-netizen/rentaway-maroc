"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DatePicker from "react-datepicker";
import { differenceInDays } from "date-fns";
import { Calendar, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { Vehicle } from "@/types";
import { Button } from "@/components/ui/Button";
import { reservationApi } from "@/lib/api";
import toast from "react-hot-toast";
import "react-datepicker/dist/react-datepicker.css";

interface BookingFormProps {
  vehicle: Vehicle;
}

const COMMISSION_RATE = 0.15;

export function BookingForm({ vehicle }: BookingFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);

  const days = startDate && endDate ? Math.max(1, differenceInDays(endDate, startDate)) : 0;
  const subtotal = days * vehicle.pricePerDay;
  const commission = subtotal * COMMISSION_RATE;
  const totalWithCaution = subtotal + vehicle.caution;

  const blockedDates = vehicle.availability
    ?.filter((a) => a.isBlocked)
    .map((a) => new Date(a.date)) || [];

  const handleReserve = async () => {
    if (!session) {
      toast.error("Connectez-vous pour réserver");
      router.push("/login");
      return;
    }

    const user = session.user as { role?: string };
    if (user?.role !== "CLIENT") {
      toast.error("Seuls les clients peuvent effectuer des réservations");
      return;
    }

    if (!startDate || !endDate) {
      toast.error("Sélectionnez les dates de location");
      return;
    }

    setLoading(true);
    try {
      const res = await reservationApi.create({
        vehicleId: vehicle.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      router.push(`/booking/${res.data.id}/payment`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la réservation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
      <div className="flex items-baseline gap-1 mb-6">
        <span className="text-2xl font-bold text-primary-600">
          {vehicle.pricePerDay.toLocaleString("fr-MA")} MAD
        </span>
        <span className="text-gray-400 text-sm">/jour</span>
      </div>

      {/* Date pickers */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Date de début
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
            <DatePicker
              selected={startDate}
              onChange={(date) => {
                setStartDate(date);
                if (endDate && date && date >= endDate) setEndDate(null);
              }}
              selectsStart
              startDate={startDate ?? undefined}
              endDate={endDate ?? undefined}
              minDate={new Date()}
              excludeDates={blockedDates}
              placeholderText="Début de la location"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              dateFormat="dd/MM/yyyy"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Date de fin
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
            <DatePicker
              selected={endDate}
              onChange={setEndDate}
              selectsEnd
              startDate={startDate ?? undefined}
              endDate={endDate ?? undefined}
              minDate={startDate || new Date()}
              excludeDates={blockedDates}
              placeholderText="Fin de la location"
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              dateFormat="dd/MM/yyyy"
            />
          </div>
        </div>
      </div>

      {/* Price breakdown */}
      {days > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {vehicle.pricePerDay} MAD × {days} jour{days > 1 ? "s" : ""}
            </span>
            <span className="font-medium text-gray-900">{subtotal.toLocaleString("fr-MA")} MAD</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Frais de service (15%)</span>
            <span>{commission.toFixed(2)} MAD</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>Caution (remboursable)</span>
            <span>{vehicle.caution.toLocaleString("fr-MA")} MAD</span>
          </div>
          <hr className="border-gray-200" />
          <div className="flex justify-between font-bold text-gray-900">
            <span>Total</span>
            <span>{totalWithCaution.toLocaleString("fr-MA")} MAD</span>
          </div>
        </div>
      )}

      <Button
        onClick={handleReserve}
        loading={loading}
        disabled={!startDate || !endDate}
        fullWidth
        size="lg"
        className="mb-3"
      >
        {session ? (
          <>
            Réserver maintenant
            <ArrowRight className="h-4 w-4" />
          </>
        ) : (
          "Se connecter pour réserver"
        )}
      </Button>

      <p className="text-xs text-gray-400 text-center">
        Vous ne serez débité qu&apos;à la remise du véhicule
      </p>

      {/* Info badges */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
          Annulation gratuite 48h à l&apos;avance
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <AlertCircle className="h-3.5 w-3.5 text-blue-500" />
          Permis {vehicle.requiredLicense} requis
        </div>
      </div>
    </div>
  );
}
