import React from 'react';
import { Link } from 'react-router-dom';

const personas = [
  { title: 'Institutions', desc: 'Upload certificates, manage escrow.', role: 'College' },
  { title: 'AICTE Officers', desc: 'Review submissions, resolve duplicates.', role: 'Officer' },
  { title: 'Approvers', desc: 'Authorize releases, dual‑key signing.', role: 'Approver' },
  { title: 'Auditors', desc: 'Inspect audit chain, verify integrity.', role: 'Management' },
];

export default function WhoIsFor() {
  return (
    <section aria-labelledby="who-for" className="py-12 bg-ink/5">
      <h2 id="who-for" className="text-center text-2xl font-bold mb-8">Who it’s for</h2>
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {personas.map((p) => (
          <div key={p.title} className="card p-5 text-center">
            <h3 className="font-semibold text-lg mb-2">{p.title}</h3>
            <p className="text-sm text-muted mb-4">{p.desc}</p>
            <Link to="/login" className="btn btn-primary btn-sm w-full">Login</Link>
          </div>
        ))}
      </div>
    </section>
  );
}
