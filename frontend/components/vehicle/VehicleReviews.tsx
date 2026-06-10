"use client";

import { useEffect, useState } from "react";
import { Star, User, MessageSquare } from "lucide-react";
import { Review } from "@/types";
import { reviewApi } from "@/lib/api";
import { StarRating } from "@/components/ui/StarRating";
import Image from "next/image";

interface VehicleReviewsProps {
  agencyId: string;
}

export function VehicleReviews({ agencyId }: VehicleReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewApi
      .getByAgency(agencyId)
      .then((res) => setReviews(res.data.reviews || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [agencyId]);

  if (loading) return null;

  // État vide → invitation explicite
  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
        <Star className="h-10 w-10 text-gray-200 mx-auto mb-2 fill-current" />
        <h2 className="font-semibold text-gray-900">Aucun avis pour le moment</h2>
        <p className="text-sm text-gray-500 mt-1">
          Soyez le premier à donner votre avis après votre location.
        </p>
      </div>
    );
  }

  // Répartition des notes
  const total = reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    return { star, count, pct: total > 0 ? (count / total) * 100 : 0 };
  });
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / total;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
        Avis clients ({reviews.length})
      </h2>

      {/* Note globale + répartition */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="text-center sm:border-r sm:border-gray-200 sm:pr-4">
          <p className="text-4xl font-bold text-primary-600">{avg.toFixed(1)}</p>
          <StarRating rating={avg} size="md" />
          <p className="text-xs text-gray-500 mt-1">{total} avis</p>
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          {dist.map(({ star, count, pct }) => (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-6 text-gray-500">{star}★</span>
              <div className="flex-1 h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                <div
                  className="h-full bg-amber-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right text-gray-500">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {reviews.slice(0, 5).map((review) => (
          <div key={review.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
            <div className="flex items-start gap-3">
              {review.author?.avatar ? (
                <Image
                  src={review.author.avatar}
                  alt={`${review.author.firstName}`}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <p className="font-medium text-sm text-gray-900">
                    {review.author?.firstName} {review.author?.lastName}
                  </p>
                  <span className="text-xs text-gray-400">
                    {new Date(review.createdAt).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <StarRating rating={review.rating} size="sm" />
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{review.comment}</p>

                {review.reply && (
                  <div className="mt-2 bg-gray-50 rounded-lg p-3 border-l-2 border-primary-300">
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1">
                      <MessageSquare className="h-3 w-3" />
                      Réponse de l&apos;agence
                    </div>
                    <p className="text-sm text-gray-600">{review.reply}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
