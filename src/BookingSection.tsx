import React, { useEffect, useMemo, useState } from 'react';
import { getJson, postJson } from './api';

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

interface AvailabilityResponse {
  date: string;
  slots: string[];
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
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string>('');

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
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'date' ? { time: '' } : {}),
    }));
  };

  useEffect(() => {
    if (!formValues.date) {
      setAvailableSlots([]);
      setAvailabilityError('');
      setIsLoadingAvailability(false);
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    setIsLoadingAvailability(true);
    setAvailabilityError('');

    getJson<AvailabilityResponse>(`/api/availability?date=${formValues.date}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!isActive) {
          return;
        }
        setAvailableSlots(response.slots);
      })
      .catch((error) => {
        if (!isActive || (error as DOMException)?.name === 'AbortError') {
          return;
        }
        console.error('Failed to fetch availability', error);
        setAvailabilityError(
          'Nem sikerült betölteni az elérhető időpontokat. Kérjük, próbálja meg később vagy válasszon másik dátumot.'
        );
        setAvailableSlots([]);
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingAvailability(false);
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [formValues.date]);

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
    if (isLoadingAvailability) {
      return 'Kérjük, várja meg, amíg betöltjük az elérhető időpontokat.';
    }
    if (availabilityError) {
      return 'Az időpontok betöltése sikertelen volt. Kérjük, válasszon új dátumot vagy próbálja meg később.';
    }
    if (!formValues.time) {
      return 'Kérjük, válasszon időpontot.';
    }
    if (availableSlots.length > 0 && !availableSlots.includes(formValues.time)) {
      return 'A kiválasztott időpont már nem érhető el. Kérjük, válasszon másikat.';
    }
    return null;
  };

  const timeSelectPlaceholder = !formValues.date
    ? 'Válasszon dátumot először...'
    : isLoadingAvailability
    ? 'Időpontok betöltése...'
    : availabilityError
    ? 'Nem sikerült betölteni az időpontokat'
    : availableSlots.length === 0
    ? 'Nincs elérhető időpont erre a napra'
    : 'Válasszon időpontot...';

  const isTimeSelectDisabled =
    !formValues.date || isLoadingAvailability || !!availabilityError || availableSlots.length === 0;

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
      await postJson('/api/appointments', formValues);

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
              disabled={isTimeSelectDisabled}
            >
              <option value="" disabled>
                {timeSelectPlaceholder}
              </option>
              {availableSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            {availabilityError && (
              <p className="form__error" role="alert">
                {availabilityError}
              </p>
            )}
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
