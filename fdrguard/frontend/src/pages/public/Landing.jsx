import React from 'react';
import Hero from '../../components/public/Hero.jsx';
import StatsStrip from '../../components/public/StatsStrip.jsx';
import CardGrid from '../../components/public/CardGrid.jsx';
import WhoIsFor from '../../components/public/WhoIsFor.jsx';
import Steps from '../../components/public/Steps.jsx';
import TrustSecurity from '../../components/public/TrustSecurity.jsx';
import Faq from '../../components/public/Faq.jsx';
import CtaBand from '../../components/public/CtaBand.jsx';

export default function Landing() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <CardGrid />
      <WhoIsFor />
      <Steps />
      <TrustSecurity />
      <Faq />
      <CtaBand />
    </>
  );
}
