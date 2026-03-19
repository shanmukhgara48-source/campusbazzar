import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import StatsBar from '@/components/StatsBar';
import WhySection from '@/components/WhySection';
import Comparison from '@/components/Comparison';
import MarqueeTicker from '@/components/MarqueeTicker';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Trust from '@/components/Trust';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';

export default function HomePage() {
  return (
    <main className="bg-[#0a0a0a] overflow-x-hidden">
      <Navbar />
      <Hero />
      <StatsBar />
      <WhySection />
      <Comparison />
      <MarqueeTicker />
      <Features />
      <HowItWorks />
      <Trust />
      <CTA />
      <Footer />
    </main>
  );
}
