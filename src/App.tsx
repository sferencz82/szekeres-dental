import React, { useMemo, useState } from 'react';
import BookingSection from './BookingSection';
import ContactSection from './ContactSection';

const App: React.FC = () => {
  const services = useMemo(
    () => [
      {
        title: 'Esztétikai fogászat',
        description: 'Mosolytervezés, porcelánhéjak és színhű tömések minden páciens igényeire szabva.',
        icon: '✨',
      },
      {
        title: 'Fogszabályozás',
        description: 'Láthatatlan sínterápiák és diszkrét készülékek az egészséges, harmonikus fogsorért.',
        icon: '🪥',
      },
      {
        title: 'Implantológia',
        description: 'Digitálisan tervezett implantátumok, azonnali terhelés és prémium felépítmények.',
        icon: '🦷',
      },
      {
        title: 'Fogfehérítés',
        description: 'Gyengéd rendelői protokoll, amely tartós ragyogást biztosít érzékenység nélkül.',
        icon: '💡',
      },
      {
        title: 'Szájsebészet',
        description: 'Bölcsességfog műtét, gyökércsúcs rezekció és minimál invazív lágyrész-korrekciók.',
        icon: '🩺',
      },
    ],
    []
  );

  const specialists = useMemo(
    () => [
      {
        name: 'Dr. Szekeres',
        role: 'Szájsebész',
        bio: 'Fejlett 3D diagnosztika és empatikus hozzáállás mellett oldja meg a legösszetettebb műtéti eseteket.',
        tenure: 'Átlagos kezelési idő: 60–90 perc',
        image:
          '/assets/dr-szekeres.png',
      },
      {
        name: 'Dr. Szekeres',
        role: 'Esztétikai fogorvos',
        bio: 'Porcelánhéjakkal és precíz, esztétikai kezelésekkel művészi szintre emeli a mosolyokat.',
        tenure: 'A szakmában 2016 óta',
        image:
          '/assets/dr-szekeres.png',
      },
      {
        name: 'Dr. Szekeres',
        role: 'Szájhigiénikus',
        bio: 'Diszkrét fogszabályozási tervekkel és digitális utánkövetéssel kíséri végig a pácienseket.',
        tenure: 'Clear aligner specialista',
        image:
          '/assets/dr-szekeres.png',
      },
    ],
    []
  );

  const priceList = useMemo(
    () => [
      { name: 'Konzultáció és kezelési terv', price: '18 000 Ft-tól', note: 'Teljes körű szájüregi vizsgálat' },
      { name: 'Professzionális tisztítás + polírozás', price: '28 000 Ft-tól', note: 'Ultrahang + airflow' },
      { name: 'Kompozit tömés', price: '32 000 Ft-tól', note: 'Színhű, rétegezett technika' },
      { name: 'Bölcsességfog műtét', price: '65 000 Ft-tól', note: 'Utógondozással együtt' },
      { name: 'Implantátum (csavar + felépítmény)', price: '260 000 Ft-tól', note: 'Prémium rendszerek' },
      { name: 'Korona (cirkon / préskerámia)', price: '120 000 Ft-tól', note: 'Digitális lenyomat' },
      { name: 'Rendelői fogfehérítés', price: '85 000 Ft-tól', note: 'Philips Zoom protokoll' },
      { name: 'Gyökércsúcs rezekció', price: '95 000 Ft-tól', note: 'Mikroszkópos támogatással' },
    ],
    []
  );

  const testimonialTabs = useMemo(
    () => [
      {
        label: 'Esztétikai fogászat',
        story:
          'Krisztina korábban takarta a mosolyát a rések és árnyalatkülönbségek miatt. Az ultrafinom héjaknak köszönhetően ma már felszabadultan mosolyog.',
      },
      {
        label: 'Fogszabályozás',
        story: 'Dániel kilenc hónapig viselt láthatatlan síneket, amelyekkel szimmetrikus, harmonikus mosolyt ért el.',
      },
      {
        label: 'Implantológia',
        story: 'Laura digitálisan tervezett implantációval és azonnali ideiglenes pótlásokkal nyerte vissza a kényelmes rágást.',
      },
      {
        label: 'Fogfehérítés',
        story: 'Márk egyetlen rendelői alkalom után természetesen ragyogó árnyalatot ért el érzékenység nélkül.',
      },
    ],
    []
  );

  const heroMetrics = [
    { label: 'Fájdalomkontroll', value: 'Altatásra kész' },
    { label: '98%', value: 'Elégedettségi arány' },
    { label: '5000+', value: 'Megújult mosoly' },
  ];

  const stats = [
    { value: '15+', label: 'Év szakmai tapasztalat' },
    { value: '98%', label: 'Pácienseink elégedettsége' },
    { value: '5000+', label: 'Megújult mosoly' },
    { value: '17', label: 'Minősített szakember' },
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
            <img src="/assets/szekeres-logo2.png" alt="Szekeres Dental logó" />
          </div>
          <div className="navbar__links">
            <button type="button" onClick={() => handleNavClick('services')}>
              Szolgáltatásaink
            </button>
            <button type="button" onClick={() => handleNavClick('specialists')}>
              Szakemberek
            </button>
            <button type="button" onClick={() => handleNavClick('testimonials')}>
              Értékelések
            </button>
            <button type="button" onClick={() => handleNavClick('prices')}>
              Áraink
            </button>
            <button type="button" onClick={() => handleNavClick('booking')}>
              Időpont
            </button>
            <button type="button" onClick={() => handleNavClick('contact')}>
              Kapcsolat
            </button>
          </div>
          <button className="btn btn-primary" type="button" onClick={() => handleNavClick('booking')}>
            Foglaljon időpontot
          </button>
        </nav>
      </header>

      <main>
        <section id="hero" className="hero">
          <div className="hero__content">
            <p className="eyebrow">Prémium fogszabályozás és esztétikai ellátás</p>
            <h1>Nem minden mosolyt kell javítani, van, amelyik víziót igényel</h1>
            <p className="subtitle">
              Magabiztos, kamerakész mosolyokat teremtünk személyre szabott esztétikai, fogszabályozó és sebészeti
              kezelésekkel – egyetlen nyugodt, designközpontú rendelőben.
            </p>
            <div className="hero__actions">
              <button className="btn btn-primary" type="button" onClick={() => handleNavClick('booking')}>
                Időpontot szeretnék
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => handleNavClick('services')}>
                Szolgáltatások megtekintése
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
                <img src="/assets/the_blue_teeth.png" alt="Kék fogak illusztráció" />
              </div>
            </div>
            <p className="hero__caption">Személyre szabott, luxus minőségű ellátás</p>
          </div>
        </section>

        <section id="services" className="section services">
          <div className="section__header">
            <p className="eyebrow">Szolgáltatások</p>
            <h2>Szakértelem minden mosolyhoz</h2>
            <p>Teljes kezelési paletta, amely növeli az önbizalmat, a komfortot és a természetes szépséget.</p>
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
            Foglaljon időpontot
          </button>
        </section>

        <section id="specialists" className="section specialists">
          <div className="section__header">
            <p className="eyebrow">Szakemberek</p>
            <h2>A csapat, amely a mosolyodért dolgozik</h2>
            <p>Empatikus, művészi szemléletű szakértők, akik megszállottan törekednek a tökéletes eredményre.</p>
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
            <p className="eyebrow">Pácienseink mondták</p>
            <h2>Valódi történetek. Valódi mosolyok.</h2>
            <p>Átalakulások, amelyek magukért beszélnek az önbizalommal teli eredményekben.</p>
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
                  alt="Kezelés előtt"
                />
                <div className="before-after__after" style={{ width: `${sliderValue}%` }}>
                  <img
                    src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80"
                    alt="Kezelés után"
                  />
                </div>
                <div className="before-after__divider" style={{ left: `${sliderValue}%` }}>
                  <span>Húzza</span>
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
            <h2>Fedezze fel a Szekeres Dental élményt</h2>
            <p>
              Nemzetközileg képzett szakértőink a legmodernebb diagnosztikát ötvözik figyelmes, személyre szabott
              gondoskodással, hogy minden találkozás nyugodt és precíz legyen.
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
            <p className="eyebrow">Áraink</p>
            <h2>Átlátható mosolybefektetések</h2>
            <p>Minden személyre szabott kezelési terv egy részletes konzultációval indul.</p>
          </div>
          <div className="prices__table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Kezelés</th>
                  <th>Ár</th>
                  <th>Megjegyzés</th>
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
            Az árak tájékoztató jellegűek, a végleges összeget a diagnosztika és a személyre szabott tervezés után
            erősítjük meg.
          </p>
        </section>

        <BookingSection />

        <ContactSection />
      </main>

      <footer className="site-footer">
        <div className="footer__content">
          <img className="footer__logo" src="/assets/szekeres-logo2.png" alt="Szekeres Dental logó" />
          <p>© {new Date().getFullYear()} Szekeres Dental – boutique fogszabályozó és esztétikai rendelő.</p>
          <p className="footer__powered">Az online foglalások a visszaigazolásunkig előzetes igénylésnek minősülnek.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
