import React, { useMemo, useState } from 'react';
import BookingSection from './BookingSection';

type ContactFormData = {
  name: string;
  email: string;
  phone: string;
  preferredDay: string;
  preferredTime: string;
  message: string;
};

const App: React.FC = () => {
  const [contactData, setContactData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    preferredDay: '',
    preferredTime: '',
    message: '',
  });

  const [contactSuccess, setContactSuccess] = useState<string>('');

  const services = useMemo(
    () => [
      {
        title: 'Esztétikai fogászat',
        description:
          'Prémium minőségű restaurációk és mosolytervezés a természetes, harmonikus megjelenésért.',
      },
      {
        title: 'Bölcsességfog műtétek',
        description:
          'Kíméletes, korszerű technikákkal végzett eltávolítás, biztonságos gyógyulási folyamattal.',
      },
      {
        title: 'Gyökércsúcs rezekciók',
        description:
          'Tapasztalt szájsebészeti háttérrel, mikroszkópos támogatással kezeljük a makacs gyulladásokat.',
      },
      {
        title: 'Implantológia',
        description:
          'Digitálisan tervezett, prémium implantátum rendszerek, látványtervekkel és gyors gyógyulással.',
        image: '/assets/implant-single.png',
      },
      {
        title: 'Fogpótlások, koronák, hidak',
        description:
          'CAD/CAM technológiával készített, tartós és esztétikus megoldások hiányzó fogak pótlására.',
        image: '/assets/all-on-4.png',
      },
      {
        title: 'Szájhigiénés kezelések, fogkőeltávolítás',
        description:
          'Professzionális ultrahangos fogkőeltávolítás és polírozás, személyre szabott tanácsadással.',
      },
      {
        title: 'Fogfehérítés',
        description:
          'Kíméletes, látványos eredményt biztosító rendelői és otthoni fehérítési lehetőségek.',
      },
      {
        title: 'Sürgősségi fogászati ellátás',
        description:
          'Gyors segítség akut fájdalom, duzzanat vagy baleset esetén is, akár a nap végéig.',
      },
    ],
    []
  );

  const priceList = [
    { name: 'Első konzultáció és állapotfelmérés', price: '18 000 Ft-tól', note: 'Részletes kezelési tervvel' },
    { name: 'Fogkőeltávolítás + polírozás', price: '28 000 Ft-tól', note: 'Szájhigiénés instrukciókkal' },
    { name: 'Esztétikus kompozit tömés', price: '32 000 Ft-tól', note: 'Fogfelszíntől függően' },
    { name: 'Bölcsességfog eltávolítása', price: '65 000 Ft-tól', note: 'Sebészeti beavatkozástól függően' },
    { name: 'Implantátum beültetés (implant + felépítmény)', price: '260 000 Ft-tól', note: 'Prémium rendszerrel' },
    { name: 'Korona (cirkon / préskerámia)', price: '120 000 Ft-tól', note: 'Digitális lenyomattal' },
    { name: 'Professzionális fogfehérítés', price: '85 000 Ft-tól', note: 'Rendelői Philips Zoom' },
    { name: 'Gyökércsúcs rezekció', price: '95 000 Ft-tól', note: 'Sebészeti kezelés, varratokkal' },
  ];

  const handleNavClick = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContactChange = (field: keyof ContactFormData, value: string) => {
    setContactData((prev) => ({ ...prev, [field]: value }));
  };

  const handleContactSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log('Contact form data:', contactData);
    setContactSuccess('Üzenetét megkaptuk, hamarosan válaszolunk!');
    setContactData({
      name: '',
      email: '',
      phone: '',
      preferredDay: '',
      preferredTime: '',
      message: '',
    });
  };

  return (
    <div className="app">
      <header className="site-header">
        <nav className="navbar">
          <div className="navbar__logo" onClick={() => handleNavClick('hero')}>
            <img src="/assets/szekeres-logo.png" alt="Szekeres Dental logó" />
          </div>
          <div className="navbar__links">
            <button type="button" onClick={() => handleNavClick('about')}>
              Rólunk
            </button>
            <button type="button" onClick={() => handleNavClick('services')}>
              Szolgáltatások
            </button>
            <button type="button" onClick={() => handleNavClick('prices')}>
              Árak
            </button>
            <button type="button" onClick={() => handleNavClick('reviews')}>
              Vélemények
            </button>
            <button type="button" onClick={() => handleNavClick('booking')}>
              Időpontfoglalás
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
            <div className="hero__text">
              <p className="eyebrow">Esztétikai fogászat & szájsebészet</p>
              <h1>Mosoly, amelyben megbízhat – Szekeres Dental Székesfehérváron</h1>
              <p className="subtitle">
                Esztétikai fogászati és szájsebészeti magánrendelőnkben nyugodt, fájdalommentes körülmények között
                gondoskodunk mosolyáról – modern technológiával, tapasztalt szakértői csapattal.
              </p>
              <div className="hero__actions">
                <button className="btn btn-primary" type="button" onClick={() => handleNavClick('booking')}>
                  Időpontfoglalás
                </button>
                <a className="btn btn-ghost" href="tel:+36705605074">
                  Telefonhívás
                </a>
              </div>
            </div>
            <div className="hero__image">
              <img src="/assets/clinic-hero.jpg" alt="Szekeres Dental rendelő" />
            </div>
          </div>
        </section>

        <section id="about" className="section about">
          <div className="section__header">
            <h2>Rólunk</h2>
            <p>Dr. Szekeres Ferenc szájsebész és esztétikai fogorvos bemutatkozása</p>
          </div>
          <div className="about__content">
            <div className="about__text">
              <h3>Dr. Szekeres Ferenc</h3>
              <p>
                Több évtizedes szájsebészeti tapasztalatával, nemzetközi továbbképzéseken szerzett tudásával és a legmodernebb
                diagnosztikai eszközökkel várja pácienseit Székesfehérvár szívében. Díjnyertes magánrendelőnkben a stresszmentes,
                biztonságos kezelések mellett a személyes törődést tartjuk a legfontosabbnak.
              </p>
              <p>
                A Seregélyesi úti rendelőben a legújabb digitális eszközökkel és fájdalomcsillapítási protokollokkal dolgozunk,
                így Ön a lehető legnagyobb nyugalomban koncentrálhat mosolya megújítására.
              </p>
              <ul className="key-points">
                <li>Esztétikai fogászat</li>
                <li>Szájsebészeti szakértelem</li>
                <li>Modern technológia</li>
                <li>Barátságos, türelmes csapat</li>
              </ul>
            </div>
            <div className="about__image">
              <img src="/assets/dr-szekeres.jpg" alt="Dr. Szekeres Ferenc" />
            </div>
          </div>
        </section>

        <section id="services" className="section services">
          <div className="section__header">
            <h2>Szolgáltatásaink</h2>
            <p>Komplex fogászati és szájsebészeti megoldások egy helyen</p>
          </div>
          <div className="services__grid">
            {services.map((service) => (
              <article className="service-card" key={service.title}>
                {service.image ? (
                  <div className="service-card__image">
                    <img src={service.image} alt={service.title} />
                  </div>
                ) : (
                  <div className="service-card__icon" aria-hidden="true">
                    <span role="img" aria-label="icon">
                      🦷
                    </span>
                  </div>
                )}
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="prices" className="section prices">
          <div className="section__header">
            <h2>Áraink (irányárak)</h2>
            <p>Transzparens díjszabás, személyre szabott kezelési tervekkel</p>
          </div>
          <div className="prices__table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Kezelés</th>
                  <th>Ár (Ft-tól)</th>
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
            A feltüntetett árak tájékoztató jellegűek. Pontos kezelési tervet és árat személyes konzultáció után adunk.
          </p>
        </section>

        <section id="reviews" className="section reviews">
          <div className="section__header">
            <h2>Pácienseink véleménye</h2>
            <p>4,9 / 5 – 100+ értékelés a Google-on</p>
          </div>
          <div className="reviews__grid">
            {[
              {
                name: 'Anna K.',
                quote:
                  'Hihetetlenül kedves csapat, teljesen fájdalommentes volt a bölcsességfog műtétem. Csak ajánlani tudom!',
              },
              {
                name: 'Péter L.',
                quote:
                  'A doktornő részletesen elmagyarázott mindent, gyönyörű lett az új koronám. Professzionális élmény.',
              },
              {
                name: 'Judit S.',
                quote: 'Modern rendelő, mosolygós asszisztensek és figyelmes ellátás – stressz nélkül végig.',
              },
              {
                name: 'Gábor M.',
                quote: 'SOS ellátásra érkeztem, perceken belül fogadtak, a fájdalom is hamar megszűnt. Köszönöm!',
              },
            ].map((review) => (
              <article className="review-card" key={review.name}>
                <div className="review-card__rating" aria-label="5 csillag értékelés">
                  {'★★★★★'}
                </div>
                <p className="review-card__quote">“{review.quote}”</p>
                <p className="review-card__author">{review.name}</p>
              </article>
            ))}
          </div>
        </section>

        <BookingSection />

        <section id="contact" className="section contact">
          <div className="section__header">
            <h2>Kapcsolat</h2>
            <p>Lépjen velünk kapcsolatba vagy látogasson el hozzánk személyesen</p>
          </div>
          <div className="contact__grid">
            <div className="contact__details">
              <h3>Elérhetőségek</h3>
              <p>8000 Székesfehérvár, Seregélyesi út 17</p>
              <p>
                Telefon: <a href="tel:+36705605074">+36 70 560 5074</a>
              </p>
              <p>
                E-mail: <a href="mailto:info@szekeresdental.hu">info@szekeresdental.hu</a>
              </p>
              <div className="opening-hours">
                <h4>Rendelési idő</h4>
                <ul>
                  <li>Hétfő: 08:00 – 18:00</li>
                  <li>Kedd: 08:00 – 18:00</li>
                  <li>Szerda: 10:00 – 20:00</li>
                  <li>Csütörtök: 08:00 – 18:00</li>
                  <li>Péntek: 08:00 – 14:00</li>
                  <li>Szombat: Előzetes egyeztetéssel</li>
                  <li>Vasárnap: Zárva</li>
                </ul>
              </div>
              <div className="map">
                <iframe
                  title="Szekeres Dental térkép"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d0!2d0!3d0"
                  width="100%"
                  height="250"
                  loading="lazy"
                  style={{ border: 0 }}
                  allowFullScreen
                ></iframe>
                {/* TODO: Update the map embed with the clinic's exact location */}
              </div>
            </div>
            <div className="contact__form-wrapper">
              <h3>Írjon nekünk</h3>
              <form className="form" onSubmit={handleContactSubmit}>
                <label>
                  Név
                  <input
                    type="text"
                    name="name"
                    value={contactData.name}
                    onChange={(e) => handleContactChange('name', e.target.value)}
                    required
                  />
                </label>
                <label>
                  E-mail
                  <input
                    type="email"
                    name="email"
                    value={contactData.email}
                    onChange={(e) => handleContactChange('email', e.target.value)}
                    required
                  />
                </label>
                <label>
                  Telefonszám
                  <input
                    type="tel"
                    name="phone"
                    value={contactData.phone}
                    onChange={(e) => handleContactChange('phone', e.target.value)}
                    required
                  />
                </label>
                <label>
                  Preferált nap
                  <input
                    type="text"
                    name="preferredDay"
                    value={contactData.preferredDay}
                    onChange={(e) => handleContactChange('preferredDay', e.target.value)}
                    placeholder="Pl. kedd délután"
                  />
                </label>
                <label>
                  Preferált időszak
                  <input
                    type="text"
                    name="preferredTime"
                    value={contactData.preferredTime}
                    onChange={(e) => handleContactChange('preferredTime', e.target.value)}
                    placeholder="Pl. 15:00 után"
                  />
                </label>
                <label>
                  Üzenet
                  <textarea
                    name="message"
                    rows={4}
                    value={contactData.message}
                    onChange={(e) => handleContactChange('message', e.target.value)}
                  />
                </label>
                <button className="btn btn-primary" type="submit">
                  Üzenet küldése
                </button>
                {contactSuccess && <p className="form__success">{contactSuccess}</p>}
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer__content">
          <img src="/assets/szekeres-logo.png" alt="Szekeres Dental logó" />
          <p>© {new Date().getFullYear()} Szekeres Dental – esztétikai fogászat & szájsebészet Székesfehérváron.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
