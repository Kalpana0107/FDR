import React from 'react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section
      className="hero min-h-screen flex items-center justify-center text-center bg-cover bg-center"
      style={{
        backgroundImage: `url('/images/hero.jpg'),
        backgroundColor: 'hsl(220,70%,30%)',
        backgroundBlendMode: 'overlay',
      }}
    >
      <div className="bg-gradient-to-br from-indigo-800 to-sky-900 bg-opacity-70 p-8 rounded-lg max-w-3xl mx-auto">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          Every security deposit. Tracked, verified, auditable.
        </h1>
        <p className="text-lg text-gray-200 mb-6">
          Full‑life‑cycle tracking of Fixed Deposit Receipts for institutions and AICTE officers.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/login" className="btn btn-primary px-6 py-3">
            Login
          </Link>
          <Link to="/register" className="btn btn-ghost px-6 py-3">
            Register Institution
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-300">
          <Link to="#how-it-works" className="underline hover:text-white">
            See how it works
          </Link>
        </p>
      </div>
    </section>
  );
}
