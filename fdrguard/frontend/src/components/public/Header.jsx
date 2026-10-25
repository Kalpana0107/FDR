import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerRef = useRef(null);
  const toggleRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Who it's for', href: '#who-for' },
    { label: 'FAQ', href: '#faq' },
  ];

  // --- A+/A- font-size controls ---
  const changeFontSize = useCallback((delta) => {
    const root = document.documentElement;
    const current = parseFloat(getComputedStyle(root).fontSize) || 16;
    const next = Math.min(24, Math.max(12, current + delta));
    root.style.fontSize = `${next}px`;
    try {
      localStorage.setItem('fdrguard_font_size', String(next));
    } catch {
      // localStorage unavailable — ignore
    }
  }, []);

  // Restore saved font size on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fdrguard_font_size');
      if (saved) {
        document.documentElement.style.fontSize = `${saved}px`;
      }
    } catch {
      // ignore
    }
  }, []);

  // --- Anchor link handler: if on another page, navigate to / then scroll ---
  const handleAnchorClick = useCallback(
    (e, href) => {
      e.preventDefault();
      setMobileOpen(false);
      const hash = href; // e.g. "#features"
      if (location.pathname !== '/') {
        navigate('/' + hash);
      } else {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [location.pathname, navigate],
  );

  // --- Esc key closes mobile menu ---
  useEffect(() => {
    if (!mobileOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [mobileOpen]);

  // --- Focus trap inside mobile drawer ---
  useEffect(() => {
    if (!mobileOpen || !drawerRef.current) return;
    const drawer = drawerRef.current;
    const focusables = drawer.querySelectorAll(
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first.focus();

    const trap = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    drawer.addEventListener('keydown', trap);
    return () => drawer.removeEventListener('keydown', trap);
  }, [mobileOpen]);

  // Scroll to hash on landing page mount (for cross-page anchor links)
  useEffect(() => {
    if (location.pathname === '/' && location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [location]);

  return (
    <header>
      {/* Top strip – accessibility & prototype notice */}
      <div className="flex items-center justify-between bg-ink/10 text-xs px-4 py-1.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeFontSize(-1)}
            className="text-ink/50 hover:text-ink transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Decrease font size"
          >
            A-
          </button>
          <button
            type="button"
            onClick={() => changeFontSize(1)}
            className="text-ink/50 hover:text-ink transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Increase font size"
          >
            A+
          </button>
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
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleAnchorClick(e, link.href)}
                className="text-ink hover:text-brand transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Link to="/login" className="btn btn-primary whitespace-nowrap min-h-[44px]">
              Login
            </Link>
            <Link to="/register" className="btn btn-ghost whitespace-nowrap min-h-[44px]">
              Register Institution
            </Link>
          </nav>

          {/* Mobile hamburger */}
          <button
            ref={toggleRef}
            type="button"
            className="md:hidden p-2 rounded-md text-ink hover:bg-surface min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div ref={drawerRef} className="md:hidden bg-card border-t border-line" role="dialog" aria-modal="true">
            <nav className="flex flex-col gap-2 p-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-ink hover:text-brand transition-colors min-h-[44px] flex items-center"
                  onClick={(e) => handleAnchorClick(e, link.href)}
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/login"
                className="btn btn-primary w-full min-h-[44px]"
                onClick={() => setMobileOpen(false)}
              >
                Login
              </Link>
              <Link
                to="/register"
                className="btn btn-ghost w-full min-h-[44px]"
                onClick={() => setMobileOpen(false)}
              >
                Register Institution
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
