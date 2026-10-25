import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '../components/public/Header.jsx';
import Footer from '../components/public/Footer.jsx';

export default function PublicLayout() {
  return (
    <>
      <a href="#main-content" className="skip-link sr-only focus:not-sr-only focus-visible:ring-2 focus-visible:ring-brand">
        Skip to content
      </a>
      <Header />
      <main id="main-content" className="min-h-screen py-8">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
