import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-ink/5 border-t border-line text-sm text-muted py-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        <div>
          <h3 className="font-heading font-bold text-ink mb-2">Portal</h3>
          <ul className="space-y-1">
            <li><Link to="/" className="hover:text-ink transition-colors">Home</Link></li>
            <li><Link to="/about" className="hover:text-ink transition-colors">About</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-heading font-bold text-ink mb-2">Resources</h3>
          <ul className="space-y-1">
            <li><a href="#features" className="hover:text-ink transition-colors">Features</a></li>
            <li><a href="#how-it-works" className="hover:text-ink transition-colors">How it works</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-heading font-bold text-ink mb-2">Legal</h3>
          <ul className="space-y-1">
            <li><a href="#privacy" className="hover:text-ink transition-colors">Privacy Policy</a></li>
            <li><a href="#terms" className="hover:text-ink transition-colors">Terms of Service</a></li>
          </ul>
        </div>
        <div>
          <h3 className="font-heading font-bold text-ink mb-2">Contact</h3>
          <ul className="space-y-1">
            <li><a href="mailto:info@fdrguard.example.com" className="hover:text-ink transition-colors">info@fdrguard.example.com</a></li>
            <li><a href="tel:+1234567890" className="hover:text-ink transition-colors">+1 234 567 890</a></li>
          </ul>
        </div>
      </div>
      <div className="mt-6 text-center text-xs text-muted">
        <p>Prototype built for Smart India Hackathon 2026. Synthetic data. Not an official AICTE website.</p>
      </div>
    </footer>
  );
}
