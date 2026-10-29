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
      tag: 'SCAN 01 // ACCURACY',
      title: 'HIT RATE @ 5',
      icon: TrendingUp,
      status: 'CALIBRATING TOP-K VECTORS',
      mockVal: '100%',
      tone: 'yellow',
    },
    {
      id: 'mrr',
      tag: 'SCAN 02 // POSITION',
      title: 'MEAN RECIPROCAL RANK',
      icon: Award,
      status: 'FLASHRANK CROSS-ENCODER',
      mockVal: '1.000',
      tone: 'default',
    },
    {
      id: 'latency',
      tag: 'SCAN 03 // TELEMETRY',
      title: 'P95 PIPELINE LATENCY',
      icon: Clock,
      status: 'PROBING ONNX CPU CORES',
      mockVal: '~60ms',
      tone: 'paper',
    },
    {
      id: 'leakage',
      tag: 'SCAN 04 // TENANCY',
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
            className="relative border-3 border-brutal-black dark:border-brutal-yellow bg-brutal-paper dark:bg-brutal-dark-surface shadow-brutal dark:shadow-brutal-dark p-5 flex flex-col justify-between overflow-hidden h-[155px]"
          >
            {/* Animated Industrial Cyber Scanline */}
            <motion.div
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                repeat: Infinity,
                duration: 2.2,
                ease: 'easeInOut',
                delay: idx * 0.35,
              }}
              className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-brutal-yellow/30 dark:via-brutal-yellow/20 to-transparent pointer-events-none transform -skew-x-12"
            />

            {/* Header: Tag + Pulsing Radar LED */}
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brutal-yellow opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brutal-yellow border border-brutal-black" />
                  </span>
                  <span className="font-mono text-[9px] font-black uppercase tracking-widest text-brutal-black/70 dark:text-brutal-yellow">
                    {card.tag}
                  </span>
                </div>
                <Icon size={15} className="text-brutal-black dark:text-brutal-yellow opacity-80" />
              </div>

              {/* Main Animated Number Display */}
              <div className="flex items-baseline justify-between mt-1">
                <div className="flex items-center gap-2">
                  <span className="font-display font-black text-2xl sm:text-3xl uppercase tracking-tight text-brutal-black dark:text-brutal-white">
                    {card.title}
                  </span>
                </div>
              </div>

              {/* High-Voltage Animated Cyber Badge */}
              <div className="mt-1 flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-brutal-yellow border-2 border-brutal-black shadow-[2px_2px_0px_#0A0A0A] font-mono text-xs font-black text-brutal-black animate-pulse">
                  <Activity size={12} className="animate-spin text-brutal-black" />
                  <span>{card.mockVal}</span>
                  <span className="text-[10px] opacity-75">SCANNING</span>
                </div>
              </div>
            </div>

            {/* Status Footer + Animated Striped Progress Bar */}
            <div className="mt-3 pt-2 border-t border-brutal-black/15 dark:border-brutal-yellow/20">
              <div className="flex items-center justify-between font-mono text-[9px] font-bold text-brutal-black/60 dark:text-brutal-white/60 uppercase tracking-wider mb-1.5">
                <span className="truncate">{card.status}</span>
                <span className="font-black text-brutal-black dark:text-brutal-yellow animate-pulse">
                  [LIVE]
                </span>
              </div>

              {/* Striped Barber-Pole Progress Bar */}
              <div className="w-full h-1.5 bg-brutal-black/10 dark:bg-brutal-black border border-brutal-black/30 dark:border-brutal-yellow/30 overflow-hidden relative">
                <motion.div
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
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
