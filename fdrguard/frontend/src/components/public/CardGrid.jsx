import React from 'react';
import { Link } from 'react-router-dom';

const cards = [
  { title: 'Proof QR Receipt', desc: 'Instant verification via QR code on receipts.', icon: '🧾' },
  { title: 'Document Version History', desc: 'Track changes of FDR documents over time.', icon: '📄' },
  { title: 'College Health Score', desc: 'Overall compliance health for each institution.', icon: '✅' },
  { title: 'Cross‑college duplicate check', desc: 'Detect duplicate FDRs across colleges.', icon: '🔎' },
];

export default function CardGrid() {
  return (
    <section aria-labelledby="what-new" className="py-12 bg-ink/5">
      <h2 id="what-new" className="text-center text-2xl font-bold mb-8">What’s New</h2>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {cards.map((c) => (
          <div key={c.title} className="card p-5 text-center">
            <div className="text-4xl mb-3">{c.icon}</div>
            <h3 className="font-semibold text-lg mb-2">{c.title}</h3>
            <p className="text-sm text-muted mb-4">{c.desc}</p>
            <Link to="#" className="text-brand hover:underline">Learn more</Link>
          </div>
        ))}
      </div>
    </section>
  );
}
