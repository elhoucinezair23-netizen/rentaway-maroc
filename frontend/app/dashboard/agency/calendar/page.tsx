"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, Loader2, Lock, Unlock } from "lucide-react";
import { Vehicle } from "@/types";
import { vehicleApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import {
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isSameDay, getDay, isToday, isBefore,
} from "date-fns";
import { fr } from "date-fns/locale";
import toast from "react-hot-toast";

interface AvailabilityData {
  blocked: string[];
  reservations: { startDate: string; endDate: string }[];
}

export default function AgencyCalendarPage() {
  const { data: session } = useSession();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availability, setAvailability] = useState<AvailabilityData>({ blocked: [], reservations: [] });
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [loadingAvail, setLoadingAvail] = useState(false);
  const [saving, setSaving] = useState(false);

  const agencyId = (session?.user as { agencyId?: string })?.agencyId;

  useEffect(() => {
    if (!agencyId) return;
    vehicleApi
      .search({ agencyId, limit: 50 })
      .then((r) => {
        const vList = r.data.vehicles || [];
        setVehicles(vList);
        if (vList.length > 0) setSelectedVehicle(vList[0].id);
      })
      .catch(() => {});
  }, [agencyId]);

  const loadAvailability = useCallback(async () => {
    if (!selectedVehicle) return;
    setLoadingAvail(true);
    try {
      const res = await vehicleApi.getAvailability(
        selectedVehicle,
        currentMonth.getMonth() + 1,
        currentMonth.getFullYear()
      );
      setAvailability(res.data);
    } catch {
      toast.error("Erreur chargement disponibilités");
    } finally {
      setLoadingAvail(false);
    }
  }, [selectedVehicle, currentMonth]);

  useEffect(() => {
    loadAvailability();
  }, [loadAvailability]);

  const isBlocked = (date: Date) =>
    availability.blocked.some((d) => isSameDay(new Date(d), date));

  const isReserved = (date: Date) =>
    availability.reservations.some(
      (r) => date >= new Date(r.startDate) && date <= new Date(r.endDate)
    );

  const isSelected = (date: Date) => selectedDates.some((d) => isSameDay(d, date));

  const toggleDate = (date: Date) => {
    if (isBefore(date, new Date()) || isReserved(date)) return;
    setSelectedDates((prev) => {
      const exists = prev.some((d) => isSameDay(d, date));
      return exists ? prev.filter((d) => !isSameDay(d, date)) : [...prev, date];
    });
  };

  const saveAvailability = async (isBlock: boolean) => {
    if (selectedDates.length === 0) {
      toast.error("Sélectionnez des dates");
      return;
    }
    setSaving(true);
    try {
      await vehicleApi.setAvailability(
        selectedVehicle,
        selectedDates.map((d) => d.toISOString().split("T")[0]),
        isBlock
      );
      toast.success(isBlock ? "Dates bloquées ✅" : "Dates débloquées ✅");
      setSelectedDates([]);
      await loadAvailability();
    } catch {
      toast.error("Erreur");
    } finally {
      setSaving(false);
    }
  };

  const monthDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startOffset = getDay(startOfMonth(currentMonth));

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <h1 className="text-2xl font-bold text-gray-900">Calendrier de disponibilités</h1>

      {/* Vehicle selector */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Véhicule</label>
        <select
          value={selectedVehicle}
          onChange={(e) => { setSelectedVehicle(e.target.value); setSelectedDates([]); }}
          className="w-full md:w-80 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
        >
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{v.title}</option>
          ))}
        </select>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setCurrentMonth((m) => subMonths(m, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h2 className="font-semibold text-gray-900 capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: fr })}
          </h2>
          <button onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        {loadingAvail ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary-600" /></div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {monthDays.map((date) => {
              const past = isBefore(date, new Date()) && !isToday(date);
              const reserved = isReserved(date);
              const blocked = isBlocked(date);
              const selected = isSelected(date);
              const today = isToday(date);

              let classes = "relative h-10 w-full rounded-lg text-sm font-medium transition-all flex items-center justify-center ";
              if (past) classes += "text-gray-200 cursor-not-allowed ";
              else if (reserved) classes += "bg-blue-100 text-blue-700 cursor-not-allowed ";
              else if (blocked && selected) classes += "bg-red-400 text-white cursor-pointer ";
              else if (blocked) classes += "bg-red-100 text-red-600 cursor-pointer ";
              else if (selected) classes += "bg-primary-600 text-white cursor-pointer shadow-sm ";
              else if (today) classes += "ring-2 ring-primary-400 text-primary-600 cursor-pointer hover:bg-primary-50 ";
              else classes += "text-gray-700 cursor-pointer hover:bg-gray-100 ";

              return (
                <button
                  key={date.toISOString()}
                  className={classes}
                  onClick={() => toggleDate(date)}
                  disabled={past || reserved}
                  title={reserved ? "Réservé" : blocked ? "Bloqué" : ""}
                >
                  {format(date, "d")}
                  {reserved && (
                    <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500">
          {[
            { color: "bg-gray-100", label: "Disponible" },
            { color: "bg-primary-600", label: "Sélectionné" },
            { color: "bg-red-100", label: "Bloqué" },
            { color: "bg-blue-100", label: "Réservé (client)" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded ${color}`} />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      {selectedDates.length > 0 && (
        <div className="bg-white rounded-2xl border border-primary-200 p-4 flex items-center justify-between flex-wrap gap-3">
          <p className="text-sm font-medium text-gray-700">
            {selectedDates.length} date(s) sélectionnée(s)
          </p>
          <div className="flex gap-3">
            <Button
              variant="danger"
              size="sm"
              loading={saving}
              onClick={() => saveAvailability(true)}
            >
              <Lock className="h-4 w-4" />
              Bloquer
            </Button>
            <Button
              variant="secondary"
              size="sm"
              loading={saving}
              onClick={() => saveAvailability(false)}
            >
              <Unlock className="h-4 w-4" />
              Débloquer
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDates([])}>
              Annuler
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
