import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';

export default function VerifyReceipt() {
  const [receipt, setReceipt] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const data = await api.getReceipt(receipt);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the receipt hash and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="verify-heading" className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="max-w-md w-full card p-8">
        <h1 id="verify-heading" className="text-2xl font-bold mb-6 text-center text-ink">
          Verify Receipt
        </h1>
        {error && <p className="text-bad-700 bg-bad-50 border border-bad-200 rounded-lg px-3 py-2 text-sm mb-4" role="alert">{error}</p>}
        {result && (
          <div className="bg-ok-50 border border-ok-200 rounded-lg p-4 mb-4 space-y-1">
            <p className="text-ok-700 font-semibold text-sm">✓ Receipt is valid</p>
            <p className="text-xs text-muted">Certificate: {result.certificate_id}</p>
            <p className="text-xs text-muted">Issuer: {result.issuer}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="receipt" className="block text-sm font-medium mb-1 text-ink">
            Receipt Hash or QR Code
          </label>
          <input
            type="text"
            id="receipt"
            required
            value={receipt}
            onChange={(e) => setReceipt(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-line bg-surface text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand min-h-[44px]"
          />
          <button
            type="submit"
            disabled={submitting}
            className="w-full btn btn-primary mt-2 min-h-[44px]"
          >
            {submitting ? 'Verifying…' : 'Verify'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <Link to="/" className="text-brand hover:underline">
            Back to Home
          </Link>
        </p>
      </div>
    </section>
  );
}
