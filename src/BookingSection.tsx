import React, { useMemo, useState } from 'react';

export interface BookingFormValues {
  fullName: string;
  email: string;
  phone: string;
  treatment: string;
  date: string;
  time: string;
  notes: string;
}

interface BookingSectionProps {
  onSubmitSuccess?: () => void;
}

const initialFormValues: BookingFormValues = {
  fullName: '',
  email: '',
  phone: '',
  treatment: '',
  date: '',
  time: '',
  notes: '',
};

const BookingSection: React.FC<BookingSectionProps> = ({ onSubmitSuccess }) => {
  const [formValues, setFormValues] = useState<BookingFormValues>(initialFormValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const timeSlots = useMemo(
    () => ['08:30', '09:00', '09:30', '10:00', '10:30', '11:30', '13:30', '15:00', '16:00', '17:00'],
    []
  );

  const treatmentOptions = useMemo(
    () => [
      'Esztétikai fogászat',
      'Bölcsességfog műtét',
      'Gyökércsúcs rezekció',
      'Implantológia',
      'Fogpótlások, koronák, hidak',
      'Szájhigiénés kezelések',
      'Fogfehérítés',
      'Sürgősségi ellátás',
    ],
    []
  );

  const handleChange = (field: keyof BookingFormValues, value: string) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!formValues.fullName.trim()) {
      return 'Kérjük, adja meg a teljes nevét.';
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
    if (!formValues.treatment) {
      return 'Kérjük, válasszon kezelést.';
    }
    if (!formValues.date) {
      return 'Kérjük, válasszon dátumot.';
    }
    const selectedDate = new Date(formValues.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return 'A kiválasztott dátum nem lehet a múltban.';
    }
    if (!formValues.time) {
      return 'Kérjük, válasszon időpontot.';
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
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formValues),
      });

      if (!response.ok) {
        throw new Error('Sikertelen mentés');
      }

      setSuccessMessage(
        'Köszönjük! Időpontfoglalási igényét rögzítettük, kollégánk hamarosan felveszi Önnel a kapcsolatot.'
      );
      setFormValues(initialFormValues);
      onSubmitSuccess?.();
    } catch (error) {
      setErrorMessage('Sajnáljuk, váratlan hiba történt. Kérjük, próbálja meg később vagy hívjon minket telefonon.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="booking" className="section booking">
      <div className="section__header">
        <h2>Időpontfoglalás</h2>
        <p>Töltse ki űrlapunkat, kollégáink egy munkanapon belül visszahívják.</p>
      </div>
      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="form__grid">
          <label>
            Teljes név
            <input
              type="text"
              name="fullName"
              value={formValues.fullName}
              onChange={(event) => handleChange('fullName', event.target.value)}
              required
            />
          </label>
          <label>
            E-mail cím
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
            Választott kezelés
            <select
              name="treatment"
              value={formValues.treatment}
              onChange={(event) => handleChange('treatment', event.target.value)}
              required
            >
              <option value="">Válasszon...</option>
              {treatmentOptions.map((treatment) => (
                <option key={treatment} value={treatment}>
                  {treatment}
                </option>
              ))}
            </select>
          </label>
          <label>
            Dátum
            <input
              type="date"
              name="date"
              value={formValues.date}
              onChange={(event) => handleChange('date', event.target.value)}
              required
            />
          </label>
          <label>
            Időpont
            <select
              name="time"
              value={formValues.time}
              onChange={(event) => handleChange('time', event.target.value)}
              required
            >
              <option value="">Válasszon időpontot...</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Megjegyzés (opcionális)
          <textarea
            name="notes"
            value={formValues.notes}
            onChange={(event) => handleChange('notes', event.target.value)}
            rows={4}
          />
        </label>
        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Küldés...' : 'Időpontot kérek'}
        </button>
        {errorMessage && <p className="form__error" role="alert">{errorMessage}</p>}
        {successMessage && <p className="form__success">{successMessage}</p>}
        <p className="form__disclaimer">
          A beérkező foglalások előzetes igénylésnek minősülnek, kollégáink telefonon vagy e-mailben erősítik meg az
          időpontot.
        </p>
      </form>
    </section>
  );
};

export default BookingSection;
