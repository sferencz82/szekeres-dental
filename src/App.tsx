import React from 'react';
import BookingSection from './BookingSection';
import ContactSection from './ContactSection';

const App: React.FC = () => {
  const heroStats = [
    { label: 'Év tapasztalat', value: '15+' },
    { label: 'Mosoly újjászületett', value: '5000+' },
    { label: 'Tanúsítvány', value: '17' },
  ];

  const serviceHighlights = [
    {
      title: 'Esztétikai fogászat',
      description: 'Finom, természetes vonalakat rajzolunk a fogakra ultramodern 3D tervezéssel.',
      media: '/assets/tooth-hologram.svg',
    },
    {
      title: 'Aligner & ortodoncia',
      description: 'Láthatatlan, kényelmes sínrendszerek a kifinomult mosolyívekhez.',
      media: '/assets/aligner.svg',
    },
    {
      title: 'Implantológia',
      description: 'Digitálisan navigált implant beültetés, gyors gyógyulással és tartós esztétikával.',
      media: '/assets/implant-bolt.svg',
    },
    {
      title: 'Fogpótlások',
      description: 'Cirkon koronák, hidak és héjak, amelyek luxus minőségben simulnak a mosolyba.',
      media: '/assets/crown.svg',
    },
    {
      title: 'Sebészet & soft care',
      description: 'Bölcsességfogak, gyökércsúcs rezekció – precízen, fájdalomkontroll mellett.',
      media: '/assets/shield.svg',
    },
  ];

  const specialists = [
    {
      name: 'Dr. Szekeres Zita',
      title: 'Szájsebész szakorvos',
      focus: 'Implantológia • arcesztétika',
      portrait: 'https://images.unsplash.com/photo-1550831107-1553da8c8464?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Dr. Márton Bence',
      title: 'Esztétikai fogorvos',
      focus: 'Digitális mosolytervezés',
      portrait: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Dr. Hajnal Emma',
      title: 'Ortodontus',
      focus: 'Aligner specialista • komplex esetek',
      portrait: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    },
  ];

  const calculatorSteps = [
    { number: '01', label: 'Cél kiválasztása', detail: 'Fehérítés, pótlás, implant, aligner' },
    { number: '02', label: 'Módszer', detail: 'Digitális tervezés, altatás, lézer' },
    { number: '03', label: 'Lojalitás', detail: 'Klubtag kedvezmények' },
    { number: '04', label: 'Fog kiválasztása', detail: 'Interaktív 3D modell' },
  ];

  const calculatorResults = [
    { label: 'Ajánlott szakértők', detail: 'Dr. Szekeres • Dr. Hajnal' },
    { label: 'Program hossza', detail: '3 hét – 6 látogatás' },
    { label: 'Kezelési költség', detail: '240 000 – 680 000 Ft' },
  ];

  const testimonials = [
    {
      quote:
        '„Valódi spa élmény fogászati környezetben. A csapat kedves, részletes és láthatóan rajong az innovációért.”',
      author: 'Christina',
      subtitle: 'Egy napos mosolyátalakítás',
    },
    {
      quote:
        '„Az implant-tervezés 3D előnézetét már az első konzultáción láttam, így minden döntés könnyebb volt.”',
      author: 'Balázs',
      subtitle: 'Implant + kerámia korona',
    },
  ];

  const storyStats = [
    { label: 'Átlagos kezelési idő', value: '3 hét' },
    { label: 'Komplexitás', value: 'Közepes' },
    { label: 'Átlagos ár', value: '320 000 Ft' },
  ];

  const handleNavClick = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="app">
      <header className="site-header">
        <nav className="navbar">
          <button className="navbar__logo" type="button" onClick={() => handleNavClick('hero')}>
            <img src="/assets/szekeres-logo.svg" alt="Szekeres Dental logó" />
            <span>Celestia Smiles</span>
          </button>
          <div className="navbar__links">
            <button type="button" onClick={() => handleNavClick('about')}>
              Rendelő
            </button>
            <button type="button" onClick={() => handleNavClick('services')}>
              Szolgáltatások
            </button>
            <button type="button" onClick={() => handleNavClick('prices')}>
              Kalkulátor
            </button>
            <button type="button" onClick={() => handleNavClick('reviews')}>
              Történetek
            </button>
            <button type="button" onClick={() => handleNavClick('booking')}>
              Időpont
            </button>
          </div>
          <div className="navbar__chips" aria-hidden="true">
            <span>Healthcare</span>
            <span>Medical design</span>
          </div>
        </nav>
      </header>

      <main className="site-main">
        <section id="hero" className="hero hero--glass">
          <div className="hero__chips" aria-hidden="true">
            <span>Website</span>
            <span>Dental clinic</span>
          </div>
          <div className="hero__grid">
            <div className="hero__panel hero__panel--text">
              <p className="eyebrow">Esztétikai fogászat & szájsebészet</p>
              <h1>Nem minden mosolyt kell megjavítani. Van, amit újra kell álmodni.</h1>
              <p className="subtitle">
                Celestia Smiles rendelőnkben a high-tech diagnosztika és a személyre szabott törődés találkozik. Soft touch,
                kristálytiszta kommunikáció, prémium végeredmények.
              </p>
              <div className="hero__actions">
                <button className="btn btn-primary" type="button" onClick={() => handleNavClick('booking')}>
                  Időpontfoglalás
                </button>
                <button className="btn btn-ghost" type="button" onClick={() => handleNavClick('contact')}>
                  Kapcsolat
                </button>
              </div>
              <div className="hero__stats">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="hero__stat">
                    <p>{stat.label}</p>
                    <strong>{stat.value}</strong>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero__panel hero__panel--visual">
              <div className="hero__visual-card">
                <img src="/assets/tooth-hologram.svg" alt="Digitális fog" />
                <div className="hero__visual-info">
                  <p>Luxury care made personal</p>
                  <button className="btn btn-secondary" type="button" onClick={() => handleNavClick('services')}>
                    Szolgáltatásaink
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="section narrative">
          <div className="narrative__card">
            <div>
              <h2>Unveil excellence.</h2>
              <p>
                A rendelőnk a digitális képalkotást, a 3D nyomtatást és az egyedi illatvilágot is beépítette a páciensélménybe.
                Soft. Defined. Celestia.
              </p>
            </div>
            <div className="narrative__metrics">
              <article>
                <strong>98%</strong>
                <p>Ajánlási arány</p>
              </article>
              <article>
                <strong>15+</strong>
                <p>Szakmai díj</p>
              </article>
              <article>
                <strong>5000+</strong>
                <p>Átalakított mosoly</p>
              </article>
            </div>
          </div>
          <div className="narrative__media">
            <img src="/assets/clinic-hero.svg" alt="Rendelő belső tere" />
            <div className="narrative__tag">Celestia Smiles — Soft. Defined.</div>
          </div>
        </section>

        <section id="services" className="section services-panel">
          <div className="section__header">
            <p className="eyebrow">Services</p>
            <h2>Expert care for every smile</h2>
            <p>Prémium, testre szabott kezelések – mind egyetlen boutique rendelőben.</p>
          </div>
          <div className="services__carousel">
            {serviceHighlights.map((service) => (
              <article key={service.title} className="service-card">
                <img src={service.media} alt={service.title} />
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <button className="btn btn-link" type="button" onClick={() => handleNavClick('booking')}>
                  Időpontot kérek →
                </button>
              </article>
            ))}
          </div>
          <div className="services__cta">
            <button className="btn btn-secondary" type="button" onClick={() => handleNavClick('booking')}>
              Konzultáció foglalása
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => handleNavClick('contact')}>
              Telefonos egyeztetés
            </button>
          </div>
        </section>

        <section id="prices" className="section calculator-panel">
          <div className="section__header">
            <p className="eyebrow">Treatment calculator</p>
            <h2>Tervezze meg mosolyútját</h2>
            <p>Becsülje meg a kezelési időt, komplexitást és költséget interaktív kártyáinkkal.</p>
          </div>
          <div className="calculator__grid">
            <div className="calculator__steps">
              {calculatorSteps.map((step) => (
                <article key={step.number} className="calculator-step">
                  <span>{step.number}</span>
                  <h3>{step.label}</h3>
                  <p>{step.detail}</p>
                </article>
              ))}
            </div>
            <div className="calculator__preview">
              <img src="/assets/aligner.svg" alt="Mosoly 3D előnézet" />
              <p>3D előnézet mozgatható fogmodellel</p>
            </div>
            <div className="calculator__results">
              {calculatorResults.map((result) => (
                <article key={result.label}>
                  <p>{result.label}</p>
                  <strong>{result.detail}</strong>
                </article>
              ))}
              <button className="btn btn-primary" type="button" onClick={() => handleNavClick('booking')}>
                Ütemezzen konzultációt
              </button>
            </div>
          </div>
        </section>

        <section id="reviews" className="section testimonials-panel">
          <div className="section__header">
            <p className="eyebrow">Testimonials</p>
            <h2>Real stories. Real smiles.</h2>
            <p>Finom, de látványos változások, amelyeket pácienseink osztottak meg velünk.</p>
          </div>
          <div className="testimonials__layout">
            <div className="testimonials__stories">
              <img src="/assets/smile-before-after.svg" alt="Előtte-utána fotó illusztráció" />
              <div className="stories__content">
                <h3>Christina mosolyának átalakulása</h3>
                <p>
                  Egy napos digitális mosolytervezéssel és lézeres ínyformálással értük el a kifinomult, de természetes
                  eredményt. A fényes porcelán héjak a saját árnyalatára lettek hangolva.
                </p>
                <div className="stories__stats">
                  {storyStats.map((stat) => (
                    <article key={stat.label}>
                      <p>{stat.label}</p>
                      <strong>{stat.value}</strong>
                    </article>
                  ))}
                </div>
              </div>
            </div>
            <div className="testimonials__cards">
              {testimonials.map((testimonial) => (
                <article key={testimonial.author} className="testimonial-card">
                  <p className="testimonial-card__quote">{testimonial.quote}</p>
                  <p className="testimonial-card__author">{testimonial.author}</p>
                  <p className="testimonial-card__subtitle">{testimonial.subtitle}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section specialists-panel" id="specialists">
          <div className="section__header">
            <p className="eyebrow">Specialists</p>
            <h2>Meet the minds behind your smile</h2>
            <p>Empátia, precizitás és stílusérzék: csapatunk minden részletet felügyel.</p>
          </div>
          <div className="specialists__grid">
            {specialists.map((doctor) => (
              <article key={doctor.name} className="specialist-card">
                <div className="specialist-card__media">
                  <img src={doctor.portrait} alt={doctor.name} />
                </div>
                <div className="specialist-card__body">
                  <div>
                    <h3>{doctor.name}</h3>
                    <p>{doctor.title}</p>
                  </div>
                  <p className="specialist-card__focus">{doctor.focus}</p>
                  <button className="btn btn-secondary" type="button" onClick={() => handleNavClick('booking')}>
                    Találkozzunk
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <BookingSection />

        <ContactSection />
      </main>

      <footer className="site-footer">
        <div className="footer__content">
          <img src="/assets/szekeres-logo.svg" alt="Szekeres Dental logó" />
          <p>© {new Date().getFullYear()} Celestia Smiles – boutique dental & soft surgery studio.</p>
          <p className="footer__powered">Online időpontfoglalás próba üzemmódban, visszaigazolás szükséges.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
