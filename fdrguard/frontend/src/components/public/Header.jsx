import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { label: 'About', href: '#about' },
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Who it’s for', href: '#who-for' },
    { label: 'FAQ', href: '#faq' },
  ];

  return (
    <header>
      {/* Top strip */}
      <div className="flex items-center justify-between bg-ink/10 text-xs px-4 py-1.5">
        <div className="flex items-center gap-2">
          <a href="#" className="text-ink/50">A-</a>
          <a href="#" className="text-ink/50">A+</a>
        </div>
        <div className="text-ink/50">Prototype · synthetic data</div>
        <div className="text-ink/50">EN</div>
      </div>

      {/* Sticky navigation */}
      <div className="sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-line shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-heading font-extrabold text-lg text-ink">
            <span>FDRGuard</span>
            <span className="rounded bg-brand/10 px-1 text-xs font-bold text-brand uppercase">Prototype</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex gap-6 items-center">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="text-ink hover:text-brand transition-colors">
                {link.label}
              </a>
            ))}
            <Link to="/login" className="btn btn-primary whitespace-nowrap">
              Login
            </Link>
            <Link to="/register" className="btn btn-ghost whitespace-nowrap">
              Register Institution
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-ink hover:bg-surface"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="md:hidden bg-card border-t border-line">
            <nav className="flex flex-col gap-2 p-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-ink hover:text-brand transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Link to="/login" className="btn btn-primary w-full" onClick={() => setMobileOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="btn btn-ghost w-full" onClick={() => setMobileOpen(false)}>
                Register Institution
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
