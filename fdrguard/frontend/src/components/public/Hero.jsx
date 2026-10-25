import React from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section
      className="min-h-screen flex items-center justify-center text-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-indigo-deep) 55%, var(--color-brand) 100%)',
      }}
    >
      <div className="relative z-10 p-8 max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          Every security deposit. Tracked, verified, auditable.
        </h1>
        <p className="text-lg text-gray-200 mb-6">
          Full‑life‑cycle tracking of Fixed Deposit Receipts for institutions and AICTE officers.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/login" className="btn btn-primary px-6 py-3 min-h-[44px]">
            Login
          </Link>
          <Link to="/register" className="btn btn-ghost px-6 py-3 min-h-[44px]">
            Register Institution
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-300">
          <a href="#how-it-works" className="underline hover:text-white">
            See how it works
          </a>
        </p>
      </div>
    </section>
  );
}
