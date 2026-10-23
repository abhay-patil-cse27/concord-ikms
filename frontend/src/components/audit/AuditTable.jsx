import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Link2, ShieldAlert } from 'lucide-react';
import { BrutalTable, BrutalBadge } from '../brutal';
import { variants } from '../../motion/presets';

/**
 * AuditTable
 * Displays monospaced cryptographic audit records, truncated SHA-256 hashes with copy trigger,
 * and previous-to-current block chain indicators.
 */
export default function AuditTable({ events = [] }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const headers = [
    'Timestamp',
    'Security Action',
    'Target Resource',
    'Actor / Identity',
    'Status',
    'SHA-256 Hash Link',
    { label: 'Request Trace', className: 'text-right' },
  ];

  return (
    <div className="w-full">
      <BrutalTable headers={headers} stickyHeader>
        {events.map((evt, idx) => {
          const hashString = evt.current_hash || evt.id || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
          const truncatedHash = `${hashString.slice(0, 10)}...${hashString.slice(-8)}`;

          return (
            <motion.tr
              key={evt.id}
              variants={variants.staggerItem}
              className="border-b-2 border-brutal-black/20 dark:border-brutal-yellow/20 font-mono text-xs hover:bg-brutal-yellow/10 transition-colors"
            >
              {/* Timestamp */}
              <td className="p-3.5 whitespace-nowrap text-brutal-muted dark:text-brutal-muted-dark text-[11px]">
                {new Date(evt.created_at).toLocaleTimeString()} • {new Date(evt.created_at).toLocaleDateString()}
              </td>

              {/* Action */}
              <td className="p-3.5 whitespace-nowrap font-bold text-brutal-black dark:text-brutal-white">
                <span className="bg-brutal-paper dark:bg-brutal-dark-surface px-1.5 py-0.5 border border-brutal-black/30 dark:border-brutal-yellow/30">
                  {evt.action}
                </span>
              </td>

              {/* Target Resource */}
              <td className="p-3.5 whitespace-nowrap">
                <BrutalBadge tone="paper" size="sm">
                  {evt.resource_type || 'SYSTEM'}
                </BrutalBadge>
              </td>

              {/* Actor ID */}
              <td className="p-3.5 whitespace-nowrap text-brutal-black/70 dark:text-brutal-white/70">
                {evt.user_id ? evt.user_id.slice(0, 8) + '...' : 'SYSTEM_GATE'}
              </td>

              {/* Status */}
              <td className="p-3.5 whitespace-nowrap">
                <BrutalBadge tone={evt.status === 'success' ? 'success' : 'accent'} size="sm" dot>
                  {evt.status ? evt.status.toUpperCase() : 'VERIFIED'}
                </BrutalBadge>
              </td>

              {/* SHA-256 Hash Chain Link */}
              <td className="p-3.5 whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <Link2 size={13} className="text-brutal-yellow flex-shrink-0" />
                  <span className="font-mono text-[10px] text-brutal-black dark:text-brutal-white bg-brutal-paper dark:bg-brutal-dark-surface px-1 border border-brutal-black/20 dark:border-brutal-yellow/20">
                    {truncatedHash}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(hashString, evt.id)}
                    className="p-1 hover:text-brutal-yellow transition-colors"
                    title="Copy full SHA-256 hash"
                  >
                    {copiedId === evt.id ? <Check size={12} className="text-brutal-success" /> : <Copy size={12} />}
                  </button>
                </div>
              </td>

              {/* Trace ID */}
              <td className="p-3.5 text-right whitespace-nowrap text-brutal-yellow dark:text-brutal-yellow text-[11px] font-bold">
                {evt.request_id ? evt.request_id.slice(0, 10) : 'trace_001'}
              </td>
            </motion.tr>
          );
        })}
      </BrutalTable>
    </div>
  );
}
