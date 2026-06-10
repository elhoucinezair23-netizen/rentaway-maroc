"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Download, Calendar, Car, Building2, Loader2 } from "lucide-react";
import { Reservation } from "@/types";
import { reservationApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function ConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reservationApi
      .getById(id)
      .then((res) => setReservation(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Réservation introuvable
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        {/* Success header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Réservation confirmée !
          </h1>
          <p className="text-gray-500">
            Votre bon de réservation vous a été envoyé par email
          </p>
          <p className="text-xs text-gray-400 mt-1">Réf : {reservation.id}</p>
        </div>

        {/* Reservation summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">Détails de la réservation</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Car className="h-5 w-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Véhicule</p>
                <p className="font-medium text-gray-900">{reservation.vehicle?.title}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Agence</p>
                <p className="font-medium text-gray-900">{reservation.agency?.name}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-primary-600 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400">Période</p>
                <p className="font-medium text-gray-900">
                  {format(new Date(reservation.startDate), "d MMMM yyyy", { locale: fr })} —{" "}
                  {format(new Date(reservation.endDate), "d MMMM yyyy", { locale: fr })}
                </p>
              </div>
            </div>
          </div>

          <hr className="border-gray-100 my-4" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Montant payé</span>
              <span className="font-semibold">{reservation.totalPrice.toLocaleString("fr-MA")} MAD</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Caution préautorisée</span>
              <span className="font-semibold">{reservation.cautionAmount.toLocaleString("fr-MA")} MAD</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {reservation.pdfPath && (
            <a href={reservation.pdfPath} target="_blank" rel="noreferrer">
              <Button variant="outline" fullWidth>
                <Download className="h-4 w-4" />
                Télécharger le bon de réservation
              </Button>
            </a>
          )}

          <Link href="/dashboard/client/reservations">
            <Button variant="secondary" fullWidth>
              Voir mes réservations
            </Button>
          </Link>

          <Link href="/search">
            <Button variant="ghost" fullWidth>
              Retour à la recherche
            </Button>
          </Link>
        </div>

        {/* Reminder */}
        <div className="mt-6 bg-blue-50 rounded-xl p-4 text-sm text-blue-700">
          <p className="font-medium mb-1">📧 Rappel par email</p>
          <p className="text-blue-600">
            Vous recevrez un rappel la veille de votre location avec toutes les informations nécessaires.
          </p>
        </div>
      </div>
    </div>
  );
}
