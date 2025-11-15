import React, { useState } from 'react';
import { postJson } from './api';

interface ContactFormValues {
  name: string;
  email: string;
  phone: string;
  preferredDay: string;
  preferredTime: string;
  message: string;
}

const initialFormValues: ContactFormValues = {
  name: '',
  email: '',
  phone: '',
  preferredDay: '',
  preferredTime: '',
  message: '',
};

const ContactSection: React.FC = () => {
  const [formValues, setFormValues] = useState<ContactFormValues>(initialFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (field: keyof ContactFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!formValues.name.trim()) {
      return 'Kérjük, adja meg a nevét.';
    }
    if (!formValues.email.trim()) {
      return 'Kérjük, adja meg e-mail címét.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formValues.email)) {
      return 'Kérjük, érvényes e-mail címet adjon meg.';
    }
    if (!formValues.phone.trim()) {
      return 'Kérjük, adja meg telefonszámát.';
    }
    if (!formValues.message.trim()) {
      return 'Kérjük, írja le üzenetét.';
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      await postJson('/api/contact', formValues);
      setSuccessMessage('Köszönjük üzenetét! Kollégánk hamarosan kapcsolatba lép Önnel.');
      setFormValues(initialFormValues);
    } catch (error) {
      setErrorMessage('Sajnáljuk, a küldés nem sikerült. Kérjük, próbálja újra vagy keressen minket telefonon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
          <form className="form" onSubmit={handleSubmit} noValidate>
            <label>
              Név
              <input
                type="text"
                name="name"
                value={formValues.name}
                onChange={(event) => handleChange('name', event.target.value)}
                required
              />
            </label>
            <label>
              E-mail
              <input
                type="email"
                name="email"
                value={formValues.email}
                onChange={(event) => handleChange('email', event.target.value)}
                required
              />
            </label>
            <label>
              Telefonszám
              <input
                type="tel"
                name="phone"
                value={formValues.phone}
                onChange={(event) => handleChange('phone', event.target.value)}
                required
              />
            </label>
            <label>
              Preferált nap
              <input
                type="text"
                name="preferredDay"
                value={formValues.preferredDay}
                onChange={(event) => handleChange('preferredDay', event.target.value)}
                placeholder="Pl. kedd délután"
              />
            </label>
            <label>
              Preferált időszak
              <input
                type="text"
                name="preferredTime"
                value={formValues.preferredTime}
                onChange={(event) => handleChange('preferredTime', event.target.value)}
                placeholder="Pl. 15:00 után"
              />
            </label>
            <label>
              Üzenet
              <textarea
                name="message"
                rows={4}
                value={formValues.message}
                onChange={(event) => handleChange('message', event.target.value)}
                required
              />
            </label>
            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Küldés...' : 'Üzenet küldése'}
            </button>
            {errorMessage && (
              <p className="form__error" role="alert">
                {errorMessage}
              </p>
            )}
            {successMessage && <p className="form__success">{successMessage}</p>}
          </form>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
