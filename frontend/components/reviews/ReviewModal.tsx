"use client";

import { useState } from "react";
import { Star, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { reviewApi } from "@/lib/api";

interface ReviewModalProps {
  open: boolean;
  onClose: () => void;
  reservationId: string;
  agencyId: string;
  vehicleTitle: string;
  onSubmitted: () => void;
}

export function ReviewModal({
  open, onClose, reservationId, agencyId, vehicleTitle, onSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const reset = () => {
    setRating(0); setHover(0); setComment(""); setLoading(false);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const submit = async () => {
    if (rating < 1) return toast.error("Choisissez une note de 1 à 5 étoiles");
    if (comment.trim().length < 10) return toast.error("Commentaire trop court (10 caractères min)");
    setLoading(true);
    try {
      await reviewApi.create({
        reservationId,
        targetId: agencyId,
        targetType: "AGENCY",
        rating,
        comment: comment.trim(),
      });
      toast.success("Merci pour votre avis !");
      reset();
      onSubmitted();
      onClose();
    } catch (e: unknown) {
      toast.error((e as Error).message || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  const label = ["", "Décevant", "Moyen", "Correct", "Très bien", "Excellent"][rating || hover] || "";

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={handleClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lift pointer-events-auto animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-gray-900">Laisser un avis</h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{vehicleTitle}</p>
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-50"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-5">
            {/* Étoiles */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre note
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(n)}
                    className="p-1 transition-transform hover:scale-110 active:scale-95"
                    aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
                  >
                    <Star
                      className={`h-8 w-8 ${
                        n <= (hover || rating)
                          ? "fill-amber-400 text-amber-400"
                          : "text-gray-200"
                      }`}
                    />
                  </button>
                ))}
                {label && (
                  <span className="ml-2 text-sm font-semibold text-amber-600">{label}</span>
                )}
              </div>
            </div>

            {/* Commentaire */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre commentaire
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Comment s'est passée votre location ?"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none"
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {comment.length}/1000
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 p-5 border-t border-gray-100">
            <button
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              onClick={submit}
              disabled={loading || rating < 1 || comment.trim().length < 10}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Publier mon avis
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
