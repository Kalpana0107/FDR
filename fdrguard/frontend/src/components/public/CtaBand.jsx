import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function CtaBand() {
  return (
    <section className="py-12 bg-gradient-to-r from-brand to-indigo-deep text-white text-center">
      <div className="max-w-3xl mx-auto px-4 space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold">Ready to secure your institution's deposits?</h2>
        <p className="text-white/80 text-sm max-w-xl mx-auto">
          Register your institution today and gain real-time visibility into your FDR lifecycle with cryptographic compliance.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link to="/register" className="btn bg-white text-brand hover:bg-white/90 px-6 py-3 font-bold">
            Register Institution
            <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="btn border border-white/30 text-white hover:bg-white/10 px-6 py-3">
            Login
          </Link>
        </div>
      </div>
    </section>
  );
}
