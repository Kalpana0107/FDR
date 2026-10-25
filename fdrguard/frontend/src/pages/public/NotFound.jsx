import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="min-h-screen flex items-center justify-center bg-surface p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-brand/10 text-brand mx-auto">
          <ShieldAlert size={36} />
        </div>
        <h1 className="text-4xl font-extrabold text-ink tracking-tight">404</h1>
        <p className="text-muted text-sm">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/"
            className="btn btn-primary px-6 py-2.5"
          >
            Back to Home
          </Link>
          <Link
            to="/app"
            className="btn btn-ghost px-6 py-2.5"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
