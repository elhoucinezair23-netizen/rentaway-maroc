"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Car, MapPin, Building2, Star } from "lucide-react";

type ApiStats = {
  totalVehicles: number;
  totalCities: number;
  totalAgencies: number;
  averageRating: number;
};

// Valeurs par défaut affichées tant que /api/public/stats ne répond pas.
const DEFAULT_STATS: ApiStats = {
  totalVehicles: 500,
  totalCities: 27,
  totalAgencies: 50,
  averageRating: 4.8,
};

function AnimatedNumber({
  end,
  suffix = "",
  decimals = 0,
  duration = 1800,
}: {
  end: number;
  suffix?: string;
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min((t - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(end * e);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [inView, end, duration]);

  return (
    <span ref={ref}>
      {val.toFixed(decimals)}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  const [stats, setStats] = useState<ApiStats>(DEFAULT_STATS);

  useEffect(() => {
    const url = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api") + "/public/stats";
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 3500);
    fetch(url, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: ApiStats | null) => {
        if (d) setStats(d);
      })
      .catch(() => {})
      .finally(() => clearTimeout(to));
    return () => {
      ctrl.abort();
      clearTimeout(to);
    };
  }, []);

  const items = [
    { value: stats.totalVehicles, suffix: "+", label: "Véhicules disponibles", Icon: Car,       decimals: 0 },
    { value: stats.totalCities,   suffix: "",  label: "Villes couvertes",      Icon: MapPin,    decimals: 0 },
    { value: stats.totalAgencies, suffix: "+", label: "Agences partenaires",   Icon: Building2, decimals: 0 },
    { value: stats.averageRating, suffix: "/5", label: "Note moyenne",         Icon: Star,      decimals: 1 },
  ];

  return (
    <section className="relative bg-secondary-600 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary-500 blur-3xl animate-blob" />
        <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-accent-500 blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {items.map(({ value, suffix, label, Icon, decimals }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-white/10 mb-4">
                <Icon className="h-6 w-6 text-accent-400" />
              </div>
              <div className="text-4xl lg:text-5xl font-bold tracking-tight">
                <AnimatedNumber end={value} suffix={suffix} decimals={decimals} />
              </div>
              <p className="mt-2 text-sm text-gray-300">{label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
