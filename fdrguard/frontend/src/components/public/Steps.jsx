import React from 'react';
import { CheckCircle2, CheckCircle, Calendar, ArrowUpRight, RefreshCw, Check } from 'lucide-react';

const steps = [
  { icon: <CheckCircle2 size={32} className="text-brand" />, label: 'Submit' },
  { icon: <CheckCircle size={32} className="text-brand" />, label: 'Validate' },
  { icon: <Check size={32} className="text-brand" />, label: 'Verify' },
  { icon: <ArrowUpRight size={32} className="text-brand" />, label: 'Active' },
  { icon: <RefreshCw size={32} className="text-brand" />, label: 'Remind' },
  { icon: <Calendar size={32} className="text-brand" />, label: 'Renew / Release' },
];

export default function Steps() {
  return (
    <section aria-labelledby="how-it-works" className="py-12 bg-ink/5">
      <h2 id="how-it-works" className="text-center text-2xl font-bold mb-8">How it works</h2>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 px-4">
        {steps.map((s) => (
          <div key={s.label} className="flex flex-col items-center text-center">
            {s.icon}
            <span className="mt-2 text-sm font-medium text-ink">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
