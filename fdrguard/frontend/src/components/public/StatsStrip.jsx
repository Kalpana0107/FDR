import React from 'react';

export default function StatsStrip() {
  const facts = [
    { label: 'Roles', value: 'College • Officer • Bank Verifier • Approver • Management' },
    { label: 'Reminders', value: '90/60/30‑day alerts' },
    { label: 'Audit‑log', value: 'Every action recorded' },
    { label: 'Bank Verification', value: 'Simulated CBS checks' },
  ];

  return (
    <section aria-labelledby="stats-strip" className="bg-ink/5 py-8">
      <h2 id="stats-strip" className="sr-only">Key facts</h2>
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4">
        {facts.map((f) => (
          <div key={f.label} className="p-4 bg-surface rounded-xl text-center">
            <p className="text-sm text-muted mb-1">{f.label}</p>
            <p className="font-medium text-ink">{f.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
