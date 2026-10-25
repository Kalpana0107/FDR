import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  { q: 'Is this a live AICTE system?', a: 'No — this is a prototype built for Smart India Hackathon 2026. All data is synthetic and simulated.' },
  { q: 'What does "Simulated CBS" mean?', a: 'Core Banking System verification is mocked. In production, API calls would connect to a real bank gateway.' },
  { q: 'Who can release a security deposit?', a: 'Releases require a dual-key workflow: an AICTE officer reviews first, then a separate approver signs off with an OTP.' },
  { q: 'How is the audit chain tamper-evident?', a: 'Every event is hashed with SHA-256 and linked to the previous block, forming a verifiable chain that breaks visibly if altered.' },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" aria-labelledby="faq-heading" className="py-12 bg-ink/5 scroll-mt-20">
      <h2 id="faq-heading" className="text-center text-2xl font-bold mb-8">Frequently Asked Questions</h2>
      <div className="max-w-3xl mx-auto space-y-3 px-4">
        {faqs.map((f, i) => (
          <div key={i} className="card p-0 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-semibold text-ink hover:bg-surface transition-colors min-h-[44px] cursor-pointer"
              aria-expanded={openIndex === i}
            >
              {f.q}
              <ChevronDown
                size={16}
                className={`shrink-0 text-muted transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
              />
            </button>
            {openIndex === i && (
              <div className="px-5 pb-4 text-sm text-muted">{f.a}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
