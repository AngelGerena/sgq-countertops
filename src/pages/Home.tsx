import Header from '../components/site/Header';
import Hero from '../components/site/Hero';
import Work from '../components/site/Work';
import Services from '../components/site/Services';
import Process from '../components/site/Process';
import QuoteForm from '../components/site/QuoteForm';
import Footer from '../components/site/Footer';

export default function Home() {
  return (
    <div className="site">
      <Header />
      <Hero />
      <Work />
      <Services />
      <Process />
      <QuoteForm />
      <Footer />
    </div>
  );
}
