import React, { useMemo, useState } from 'react';
import BookingSection from './BookingSection';
import ContactSection from './ContactSection';

const App: React.FC = () => {
  const services = useMemo(
    () => [
      {
        title: 'Aesthetic dentistry',
        description: 'Smile design, porcelain veneers and color harmonizing restorations tailored to every patient.',
        icon: '✨',
      },
      {
        title: 'Orthodontics',
        description: 'Aligner-based treatments and discreet braces for confident, healthy alignment.',
        icon: '🪥',
      },
      {
        title: 'Implantology',
        description: 'Digitally planned implants, immediate load solutions and premium abutments.',
        icon: '🦷',
      },
      {
        title: 'Whitening',
        description: 'Gentle in-office whitening protocols with lasting luminosity and zero sensitivity.',
        icon: '💡',
      },
      {
        title: 'Surgical dentistry',
        description: 'Wisdom tooth surgery, apicoectomy and minimally invasive soft tissue corrections.',
        icon: '🩺',
      },
    ],
    []
  );

  const specialists = useMemo(
    () => [
      {
        name: 'Dr. Szekeres',
        role: 'Szajsebesz',
        bio: 'Transforms complex surgical cases with advanced 3D diagnostics and gentle care.',
        tenure: 'Treatment time (est): 60-90 mins',
        image:
          '/assets/dr-szekeres.png',
      },
      {
        name: 'Dr. Szekeres',
        role: 'Esztetikai fogorvos',
        bio: 'Crafts artistic transformations with porcelain veneers and cosmetic care.',
        tenure: 'Practicing since 2016',
        image:
          '/assets/dr-szekeres.png',
      },
      {
        name: 'Dr. Szekeres',
        role: 'Szajhigenikus',
        bio: 'Aligns smiles with discreet orthodontic plans and digital progress tracking.',
        tenure: 'Clear aligner expert',
        image:
          '/assets/dr-szekeres.png',
      },
    ],
    []
  );

  const priceList = useMemo(
    () => [
      { name: 'Consultation & treatment plan', price: '18 000 Ft-tól', note: 'Comprehensive oral exam' },
      { name: 'Professional cleaning + polish', price: '28 000 Ft-tól', note: 'Ultrasonic & airflow' },
      { name: 'Composite restoration', price: '32 000 Ft-tól', note: 'Shade-matched layers' },
      { name: 'Wisdom tooth surgery', price: '65 000 Ft-tól', note: 'Includes aftercare' },
      { name: 'Implant (implant + abutment)', price: '260 000 Ft-tól', note: 'Premium systems' },
      { name: 'Crown (zirconia / press ceramic)', price: '120 000 Ft-tól', note: 'Digital impression' },
      { name: 'In-office whitening', price: '85 000 Ft-tól', note: 'Philips Zoom protocol' },
      { name: 'Apicoectomy', price: '95 000 Ft-tól', note: 'Microscope-assisted' },
    ],
    []
  );

  const testimonialTabs = useMemo(
    () => [
      { label: 'Aesthetic dentistry', story: 'Christina felt self-conscious about gaps and uneven shades. With ultra-thin veneers, she now smiles with ease.' },
      { label: 'Orthodontics', story: 'Daniel completed a 9-month aligner program for a confident, symmetrical smile.' },
      { label: 'Implantology', story: 'Laura regained full chewing comfort after a digital implant workflow with immediate temporaries.' },
      { label: 'Whitening', story: 'Mark achieved a luminous, natural brightness in just one visit.' },
    ],
    []
  );

  const heroMetrics = [
    { label: 'Comfort-focused', value: 'Sedation ready' },
    { label: '98%', value: 'Satisfaction rate' },
    { label: '5000+', value: 'Smiles transformed' },
  ];

  const stats = [
    { value: '15+', label: 'Years of excellence' },
    { value: '98%', label: 'Patient satisfaction rate' },
    { value: '5000+', label: 'Smiles transformed' },
    { value: '17', label: 'Certified experts' },
  ];

  const [activeTab, setActiveTab] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);

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
          <div className="navbar__logo" onClick={() => handleNavClick('hero')}>
            <img src="/assets/szekeres-logo2.png" alt="Szekeres Dental logo" />
          </div>
          <div className="navbar__links">
            <button type="button" onClick={() => handleNavClick('services')}>
              Szolgaltatasaink
            </button>
            <button type="button" onClick={() => handleNavClick('specialists')}>
              Specialists
            </button>
            <button type="button" onClick={() => handleNavClick('testimonials')}>
              Ertekelesek
            </button>
            <button type="button" onClick={() => handleNavClick('prices')}>
              Araink
            </button>
            <button type="button" onClick={() => handleNavClick('booking')}>
              Idopont
            </button>
            <button type="button" onClick={() => handleNavClick('contact')}>
              Kapcsolat
            </button>
          </div>
          <button className="btn btn-primary" type="button" onClick={() => handleNavClick('booking')}>
            Schedule a visit
          </button>
        </nav>
      </header>

      <main>
        <section id="hero" className="hero">
          <div className="hero__content">
            <p className="eyebrow">Premium orthodontic & aesthetic care</p>
            <h1>Not all smiles need fixing, some need vision</h1>
            <p className="subtitle">
              We craft confident, camera-ready smiles with bespoke aesthetic dentistry, orthodontics and surgical care —
              all under one calming, design-led roof.
            </p>
            <div className="hero__actions">
              <button className="btn btn-primary" type="button" onClick={() => handleNavClick('booking')}>
                Schedule a visit
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => handleNavClick('services')}>
                Explore services
              </button>
            </div>
            <div className="hero__metrics">
              {heroMetrics.map((metric) => (
                <div className="metric-card" key={metric.label}>
                  <span>{metric.value}</span>
                  <p>{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hero__visual" aria-hidden="true">
            <div className="hero__orb hero__orb--lg"></div>
            <div className="hero__orb hero__orb--sm"></div>
            <div className="hero__glass">
              <div className="hero__glass-core"></div>
              <div className="hero__glass-glow">
                <img src="/assets/the_blue_teeth.png" alt="The Blue Teeth" />
              </div>
            </div>
            <p className="hero__caption">Luxury care made personal</p>
          </div>
        </section>

        <section id="services" className="section services">
          <div className="section__header">
            <p className="eyebrow">Services</p>
            <h2>Expert care for every smile</h2>
            <p>Complete spectrum of treatments that elevate confidence, comfort and natural beauty.</p>
          </div>
          <div className="services__grid">
            {services.map((service) => (
              <article className="service-card" key={service.title}>
                <div className="service-card__icon" aria-hidden="true">
                  {service.icon}
                </div>
                <div className="service-card__content">
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                </div>
              </article>
            ))}
          </div>
          <button className="btn btn-secondary" type="button" onClick={() => handleNavClick('booking')}>
            Schedule a visit
          </button>
        </section>

        <section id="specialists" className="section specialists">
          <div className="section__header">
            <p className="eyebrow">Specialists</p>
            <h2>A csapat aki a mosolyodert felel</h2>
            <p>Az empatikus es muveszi szakemberek akik a tokeletessegre torekednek.</p>
          </div>
          <div className="specialists__grid">
            {specialists.map((specialist) => (
              <article className="specialist-card" key={specialist.name}>
                <div className="specialist-card__image">
                  <img src={specialist.image} alt={specialist.name} loading="lazy" />
                </div>
                <div className="specialist-card__body">
                  <div>
                    <p className="specialist-card__role">{specialist.role}</p>
                    <h3>{specialist.name}</h3>
                    <p>{specialist.bio}</p>
                  </div>
                  <p className="specialist-card__tenure">{specialist.tenure}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="testimonials" className="section testimonials">
          <div className="section__header">
            <p className="eyebrow">Testimonials</p>
            <h2>Real stories. Real smiles.</h2>
            <p>Transformation journeys told through visible, confident results.</p>
          </div>
          <div className="testimonials__content">
            <div className="testimonial-tabs">
              {testimonialTabs.map((tab, index) => (
                <button
                  key={tab.label}
                  className={`testimonial-tab ${index === activeTab ? 'is-active' : ''}`}
                  type="button"
                  onClick={() => setActiveTab(index)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <p className="testimonial-story">{testimonialTabs[activeTab].story}</p>
            <div className="before-after">
              <div className="before-after__viewer">
                <img
                  src="https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=800&q=80"
                  alt="Before treatment"
                />
                <div className="before-after__after" style={{ width: `${sliderValue}%` }}>
                  <img
                    src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80"
                    alt="After treatment"
                  />
                </div>
                <div className="before-after__divider" style={{ left: `${sliderValue}%` }}>
                  <span>Drag</span>
                </div>
              </div>
              <input
                className="before-after__slider"
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={(event) => setSliderValue(Number(event.target.value))}
              />
            </div>
          </div>
        </section>

        <section id="about" className="section stats">
          <div className="stats__content">
            <h2>Unveil excellence. Discover the Celestia difference.</h2>
            <p>
              Board-certified experts pairing cutting-edge diagnostics with concierge-style service. Every visit feels calm,
              considered and obsessively precise.
            </p>
            <div className="stats__grid">
              {stats.map((item) => (
                <div className="stats-card" key={item.label}>
                  <span>{item.value}</span>
                  <p>{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="prices" className="section prices">
          <div className="section__header">
            <p className="eyebrow">Pricing</p>
            <h2>Transparent smile investments</h2>
            <p>Personalized treatment plans begin with an in-depth consultation.</p>
          </div>
          <div className="prices__table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Treatment</th>
                  <th>Price</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {priceList.map((item) => (
                  <tr key={item.name}>
                    <td>{item.name}</td>
                    <td>{item.price}</td>
                    <td>{item.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="prices__note">
            All prices are indicative. Exact costs are confirmed after diagnostics and tailored planning.
          </p>
        </section>

        <BookingSection />

        <ContactSection />
      </main>

      <footer className="site-footer">
        <div className="footer__content">
          <img src="/assets/szekeres-logo2.png" alt="Szekeres Dental logo" />
          <p>© {new Date().getFullYear()} Celestia Smiles – boutique orthodontic & aesthetic studio.</p>
          <p className="footer__powered">Online booking requests are provisional until confirmed by our coordinators.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
