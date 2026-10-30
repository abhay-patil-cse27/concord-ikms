import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Clock, ShieldCheck, Cpu, Zap, Activity } from 'lucide-react';

/**
 * BenchmarkKpiSkeleton
 * High-octane Yellow Brutalist animated telemetry cards displayed during benchmark loading.
 * Features animated radar scanlines, pulsating cyber-badges, and live diagnostic text.
 */
export default function BenchmarkKpiSkeleton() {
  const skeletonCards = [
    {
      id: 'hit_rate',
      title: 'HIT RATE @ 5',
      icon: TrendingUp,
      status: 'CALIBRATING TOP-5 VECTORS',
      mockVal: '100%',
      tone: 'yellow',
    },
    {
      id: 'mrr',
      title: 'MEAN RECIPROCAL RANK (MRR@5)',
      icon: Award,
      status: 'FLASHRANK CROSS-ENCODER',
      mockVal: '1.000',
      tone: 'default',
    },
    {
      id: 'latency',
      title: 'P95 PIPELINE LATENCY',
      icon: Clock,
      status: 'PROBING ONNX CPU INFERENCE',
      mockVal: '62.4ms',
      tone: 'paper',
    },
    {
      id: 'leakage',
      title: 'CROSS-DEPT LEAKAGE',
      icon: ShieldCheck,
      status: 'VERIFYING RBAC ISOLATION',
      mockVal: '0.0%',
      tone: 'black',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {skeletonCards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.06 }}
            className="p-5 border-3 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface shadow-brutal dark:shadow-brutal-dark h-full flex flex-col justify-between relative overflow-hidden"
          >
            {/* Animated Laser Scanline */}
            <motion.div
              animate={{ x: ['-100%', '200%'] }}
              transition={{
                repeat: Infinity,
                duration: 2.0,
                ease: 'easeInOut',
                delay: idx * 0.25,
              }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-brutal-yellow/35 dark:via-brutal-yellow/25 to-transparent pointer-events-none transform -skew-x-12"
            />

            <div>
              {/* Header: Title + Pulsing Radar LED + Icon */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brutal-yellow opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brutal-yellow border border-brutal-black" />
                  </span>
                  <span className="font-mono text-[10px] font-black uppercase tracking-wider text-brutal-black/70 dark:text-brutal-white/70">
                    {card.title}
                  </span>
                </div>
                <Icon size={16} className="text-brutal-black dark:text-brutal-yellow flex-shrink-0" />
              </div>

              {/* Big Metric Number + High-Voltage SCAN Badge */}
              <div className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight text-brutal-black dark:text-brutal-white my-1 flex items-baseline justify-between">
                <span>{card.mockVal}</span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-brutal-yellow border-2 border-brutal-black font-mono text-[10px] font-black text-brutal-black animate-pulse shadow-[2px_2px_0px_#0A0A0A]">
                  <Activity size={10} className="animate-spin text-brutal-black" />
                  <span>SCAN</span>
                </span>
              </div>
            </div>

            {/* Footer Description + Animated Progress Strip */}
            <div className="font-mono text-[10px] text-brutal-muted dark:text-brutal-muted-dark uppercase tracking-wider mt-3 pt-2 border-t border-brutal-black/10 dark:border-brutal-yellow/10">
              <div className="flex items-center justify-between mb-1.5">
                <span className="truncate">{card.status}</span>
                <span className="font-black text-brutal-black dark:text-brutal-yellow animate-pulse flex-shrink-0 ml-1">
                  [LIVE]
                </span>
              </div>

              {/* Striped Industrial Barber-Pole Progress Bar */}
              <div className="w-full h-1 bg-brutal-black/10 dark:bg-brutal-black border border-brutal-black/30 dark:border-brutal-yellow/30 overflow-hidden relative">
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  className="w-1/2 h-full bg-brutal-yellow border-r border-l border-brutal-black"
                />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
