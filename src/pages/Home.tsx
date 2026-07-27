import Header from '../components/site/Header';
import Hero from '../components/site/Hero';
import Work from '../components/site/Work';
import Materials from '../components/site/Materials';
import Services from '../components/site/Services';
import Process from '../components/site/Process';
import Faq from '../components/site/Faq';
import AreaBand from '../components/site/AreaBand';
import QuoteWizard from '../components/site/QuoteWizard';
import Footer from '../components/site/Footer';
import { useReveal } from '../lib/useReveal';

export default function Home() {
  useReveal();
  return (
    <div className="site">
      <Header />
      <Hero />
      <Work />
      <Materials />
      <Services />
      <Process />
      <Faq />
      <AreaBand />
      <QuoteWizard />
      <Footer />
    </div>
  );
}
