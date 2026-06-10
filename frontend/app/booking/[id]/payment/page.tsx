"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import { Reservation } from "@/types";
import { reservationApi, paymentApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { differenceInDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";
import Image from "next/image";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY || "");

function CheckoutForm({
  reservationId,
  cautionClientSecret,
}: {
  reservationId: string;
  cautionClientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    try {
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        toast.error(error.message || "Erreur de paiement");
        return;
      }

      router.push(`/booking/${reservationId}/confirmation`);
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement className="mb-6" />
      <Button type="submit" loading={loading} disabled={!stripe} fullWidth size="lg">
        <Lock className="h-4 w-4" />
        Confirmer le paiement sécurisé
      </Button>
      <p className="text-xs text-gray-400 text-center mt-3 flex items-center justify-center gap-1">
        <ShieldCheck className="h-3.5 w-3.5" />
        Paiement sécurisé par Stripe
      </p>
    </form>
  );
}

export default function PaymentPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [cautionSecret, setCautionSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) {
      router.push("/login");
      return;
    }

    async function init() {
      try {
        const [resRes, intentRes] = await Promise.all([
          reservationApi.getById(id),
          paymentApi.createIntent(id),
        ]);
        setReservation(resRes.data);
        setClientSecret(intentRes.data.mainClientSecret);
        setCautionSecret(intentRes.data.cautionClientSecret);
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Erreur");
        router.back();
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [id, session, router]);

  if (loading || !reservation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const days = Math.max(
    1,
    differenceInDays(new Date(reservation.endDate), new Date(reservation.startDate))
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Steps */}
        <div className="flex items-center gap-3 mb-8">
          {["Récapitulatif", "Paiement", "Confirmation"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 1
                    ? "bg-primary-600 text-white"
                    : i < 1
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm font-medium ${i === 1 ? "text-primary-600" : "text-gray-400"}`}>
                {step}
              </span>
              {i < 2 && <div className="h-0.5 w-8 bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Récapitulatif</h3>

              {reservation.vehicle?.images?.[0] && (
                <div className="relative h-32 rounded-xl overflow-hidden mb-4">
                  <Image
                    src={reservation.vehicle.images[0]}
                    alt={reservation.vehicle.title || ""}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <p className="font-semibold text-gray-900 text-sm">
                {reservation.vehicle?.title}
              </p>
              <p className="text-sm text-gray-500 mb-4">{reservation.agency?.name}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Début</span>
                  <span className="font-medium">
                    {format(new Date(reservation.startDate), "d MMM yyyy", { locale: fr })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Fin</span>
                  <span className="font-medium">
                    {format(new Date(reservation.endDate), "d MMM yyyy", { locale: fr })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Durée</span>
                  <span className="font-medium">{days} jour{days > 1 ? "s" : ""}</span>
                </div>
                <hr className="border-gray-100" />
                <div className="flex justify-between">
                  <span className="text-gray-500">Location</span>
                  <span className="font-medium">{reservation.totalPrice.toLocaleString("fr-MA")} MAD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Caution</span>
                  <span className="font-medium">{reservation.cautionAmount.toLocaleString("fr-MA")} MAD</span>
                </div>
                <hr className="border-gray-100" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary-600">
                    {(reservation.totalPrice + reservation.cautionAmount).toLocaleString("fr-MA")} MAD
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="md:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary-600" />
                Paiement sécurisé
              </h3>

              {clientSecret ? (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: { colorPrimary: "#f97316" },
                    },
                  }}
                >
                  <CheckoutForm
                    reservationId={id}
                    cautionClientSecret={cautionSecret || ""}
                  />
                </Elements>
              ) : (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                </div>
              )}

              <button
                onClick={() => router.back()}
                className="mt-4 flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
