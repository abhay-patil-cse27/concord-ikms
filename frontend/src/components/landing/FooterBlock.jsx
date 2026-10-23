import React from 'react';
import { Shield, ExternalLink, ArrowUp } from 'lucide-react';
import { BrutalBadge } from '../brutal';

/**
 * FooterBlock
 * Heavy brutalist footer with institutional copyright, repository links, and specifications.
 */
export default function FooterBlock() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="w-full bg-brutal-black text-brutal-white border-t-3 border-brutal-black dark:border-brutal-yellow select-none">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 flex flex-col gap-8">
        
        {/* Top Tier: Identity & Scroll to Top */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-8 border-b-2 border-brutal-white/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brutal-yellow border-2 border-brutal-black flex items-center justify-center">
              <Shield size={22} className="text-brutal-black" strokeWidth={2.5} />
            </div>
            <div>
              <div className="font-display font-black text-xl tracking-tight uppercase text-brutal-white">
                CONCORD IKMS
              </div>
              <div className="font-mono text-[10px] text-brutal-yellow uppercase tracking-widest">
                Cognitive Institutional Memory Platform
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BrutalBadge tone="yellow" size="sm">
              FINAL YEAR MEGA PROJECT 2026-27
            </BrutalBadge>
            <button
              type="button"
              onClick={scrollToTop}
              className="p-2 border-2 border-brutal-white bg-brutal-dark hover:bg-brutal-yellow hover:text-brutal-black transition-colors"
              title="Return to top"
              aria-label="Return to top"
            >
              <ArrowUp size={16} />
            </button>
          </div>
        </div>

        {/* Middle Tier: Institutional Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
          <div>
            <div className="font-black text-brutal-yellow uppercase mb-2">Institution</div>
            <p className="text-brutal-muted-dark leading-relaxed">
              Kolhapur Institute of Technology's College of Engineering (Autonomous), Kolhapur.
              Department of Computer Science & Engineering.
            </p>
          </div>

          <div>
            <div className="font-black text-brutal-yellow uppercase mb-2">Compliance & Specs</div>
            <p className="text-brutal-muted-dark leading-relaxed">
              OWASP ASVS 4.1 Access Control • Autonomous Academic Regulations 2024 • Cryptographic SHA-256 Audit Trail • Hybrid RRF Search.
            </p>
          </div>

          <div>
            <div className="font-black text-brutal-yellow uppercase mb-2">Code & Deliverables</div>
            <a
              href="https://github.com/abhay-patil-cse27/concord-ikms"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-brutal-white hover:text-brutal-yellow underline underline-offset-4"
            >
              <span>GitHub: abhay-patil-cse27/concord-ikms</span>
              <ExternalLink size={12} />
            </a>
            <div className="text-brutal-muted-dark mt-1">
              Production Build v1.0.0
            </div>
          </div>
        </div>

        {/* Bottom Tier: Legal / Archival */}
        <div className="pt-6 border-t border-brutal-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[10px] text-brutal-muted-dark">
          <div>
            CONCORD © 2026–27 • Department of Computer Science & Engineering • All institutional rights reserved.
          </div>
          <div className="text-brutal-yellow font-bold uppercase">
            Grounded AI • Zero Cross-Tenant Leakage
          </div>
        </div>

      </div>
    </footer>
  );
}
