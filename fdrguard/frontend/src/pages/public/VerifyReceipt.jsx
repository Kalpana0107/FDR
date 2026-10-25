import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/client.js';

export default function VerifyReceipt() {
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    try {
      // Assuming the API client has a verifyReceipt method; if not, this will error.
      const data = await api.verifyReceipt(receipt);
      setResult(data);
    } catch (err) {
      setError(err.message || 'Verification failed');
    }
  };

  return (
    <section aria-labelledby="verify-heading" className="flex min-h-screen items-center justify-center bg-ink/5 p-4">
      <div className="max-w-md w-full bg-white dark:bg-ink p-8 rounded-lg shadow-md">
        <h1 id="verify-heading" className="text-2xl font-bold mb-6 text-center">
          Verify Receipt
        </h1>
        {error && <p className="text-danger mb-4" role="alert">{error}</p>}
        {result && (
          <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4 overflow-x-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <label htmlFor="receipt" className="block text-sm font-medium mb-1">
            Receipt ID or QR code
          </label>
          <input
            type="text"
            id="receipt"
            required
            value={receipt}
            onChange={(e) => setReceipt(e.target.value)}
            className="w-full rounded border-gray-300 focus:ring-brand focus:border-brand"
          />
          <button type="submit" className="w-full btn btn-primary mt-2">
            Verify
          </button>
        </form>
        <p className="mt-4 text-center text-sm">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-brand hover:underline"
          >
            Back to Home
          </button>
        </p>
      </div>
    </section>
  );
}
