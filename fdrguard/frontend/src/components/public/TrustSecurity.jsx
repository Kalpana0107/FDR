import React from 'react';
import { ShieldCheck, Lock, Eye } from 'lucide-react';

const items = [
  { icon: ShieldCheck, title: 'SHA-256 Audit Chain', desc: 'Every action is cryptographically chained so tampering is instantly detectable.' },
  { icon: Lock, title: 'Dual-Key Release', desc: 'Security deposits are released only after two independent approvers sign off.' },
  { icon: Eye, title: 'Transparent Ledger', desc: 'Full version history of every FDR — visible to all authorized stakeholders.' },
];

export default function TrustSecurity() {
  return (
    <section aria-labelledby="trust-heading" className="py-12 bg-surface">
      <h2 id="trust-heading" className="text-center text-2xl font-bold mb-8">Trust &amp; Security</h2>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <div key={it.title} className="card p-5 text-center space-y-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 text-brand mx-auto">
                <Icon size={24} />
              </div>
              <h3 className="font-semibold text-lg">{it.title}</h3>
              <p className="text-sm text-muted">{it.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
