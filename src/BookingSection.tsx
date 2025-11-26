import React, { useEffect, useMemo, useState } from 'react';
import treatments from '../shared/treatments.json';
import openingTimes from '../shared/openingTimes.json';
import { getJson, postJson } from './api';

export interface BookingFormValues {
  fullName: string;
  email: string;
  phone: string;
  treatments: string[];
  treatmentDurationMinutes?: number;
  treatmentPriceFrom?: string;
  date: string;
  time: string;
  notes: string;
}

interface TreatmentOption {
  name: string;
  time_required_in_minutes: number;
  basic_price_from: string;
}

type DaySchedule = { open: string; close: string } | null;

interface OpeningTimesConfig {
  weekly: Partial<Record<
    'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday',
    DaySchedule
  >>;
  closures?: { date: string; reason?: string; schedule?: DaySchedule }[];
}

interface BookingSectionProps {
  onSubmitSuccess?: () => void;
}

interface AvailabilityResponse {
  date: string;
  slots: string[];
  closedReason?: string;
}

const initialFormValues: BookingFormValues = {
  fullName: '',
  email: '',
  phone: '',
  treatments: [],
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
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const treatmentOptions = useMemo(() => treatments as TreatmentOption[], []);
  const openingConfig = useMemo(() => openingTimes as OpeningTimesConfig, []);
  const weeklySchedule = useMemo(
    () => ({
      sunday: openingConfig.weekly?.sunday ?? null,
      monday: openingConfig.weekly?.monday ?? null,
      tuesday: openingConfig.weekly?.tuesday ?? null,
      wednesday: openingConfig.weekly?.wednesday ?? null,
      thursday: openingConfig.weekly?.thursday ?? null,
      friday: openingConfig.weekly?.friday ?? null,
      saturday: openingConfig.weekly?.saturday ?? null,
    }),
    [openingConfig.weekly]
  );
  const closureMap = useMemo(
    () => new Map(openingConfig.closures?.map((closure) => [closure.date, closure]) ?? []),
    [openingConfig.closures]
  );

  const getTreatmentDetails = (name: string): TreatmentOption | undefined =>
    treatmentOptions.find((option) => option.name === name);

  const parsePriceValue = (value?: string): number => {
    if (!value) {
      return 0;
    }
    const numeric = Number.parseInt(value.replace(/\D/g, ''), 10);
    return Number.isNaN(numeric) ? 0 : numeric;
  };

  const formatPriceValue = (value: number): string | undefined =>
    value > 0 ? `${value.toLocaleString('hu-HU')} Ft` : undefined;

  const summarizeTreatments = (selectedNames: string[]): {
    totalDuration?: number;
    totalPriceFrom?: string;
  } => {
    const selectedTreatments = selectedNames
      .map((name) => getTreatmentDetails(name))
      .filter(Boolean) as TreatmentOption[];

    if (selectedTreatments.length === 0) {
      return {};
    }

    const totalDuration = selectedTreatments.reduce(
      (sum, treatment) => sum + treatment.time_required_in_minutes,
      0
    );
    const totalPrice = selectedTreatments.reduce(
      (sum, treatment) => sum + parsePriceValue(treatment.basic_price_from),
      0
    );

    return {
      totalDuration,
      totalPriceFrom: formatPriceValue(totalPrice),
    };
  };

  const resolveTreatmentDuration = (selectedTreatments: string[], fallback?: number): number =>
    summarizeTreatments(selectedTreatments).totalDuration ?? fallback ?? 30;

  const getScheduleForDate = (
    date: string
  ): { schedule: DaySchedule; reason?: string; isClosed: boolean } | null => {
    if (!date) {
      return null;
    }

    const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
    const override = closureMap.get(date);
    const schedule = override?.schedule ?? Object.values(weeklySchedule)[weekday] ?? null;

    return { schedule, reason: override?.reason, isClosed: !schedule };
  };

  const scheduleInfo = useMemo(
    () => (formValues.date ? getScheduleForDate(formValues.date) : null),
    [formValues.date, closureMap, weeklySchedule]
  );
  const isClosedDay = scheduleInfo?.isClosed ?? false;
  const selectedTreatmentsLabel = formValues.treatments.join(', ');

  const handleChange = (field: Exclude<keyof BookingFormValues, 'treatments'>, value: string) => {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'date' ? { time: '' } : {}),
    }));
  };

  const handleTreatmentToggle = (name: string) => {
    setFormValues((prev) => {
      const treatments = prev.treatments.includes(name)
        ? prev.treatments.filter((treatment) => treatment !== name)
        : [...prev.treatments, name];
      const { totalDuration, totalPriceFrom } = summarizeTreatments(treatments);

      return {
        ...prev,
        treatments,
        treatmentDurationMinutes: totalDuration,
        treatmentPriceFrom: totalPriceFrom,
        time: '',
      };
    });
  };

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (!formValues.date) {
      setAvailableSlots([]);
      setAvailabilityError('');
      setIsLoadingAvailability(false);
      return;
    }

    const dateSchedule = scheduleInfo;

    if (dateSchedule?.isClosed) {
      setAvailableSlots([]);
      setAvailabilityError(
        dateSchedule.reason || 'Ezen a napon a rendelő zárva tart. Válasszon egy másik dátumot.'
      );
      setIsLoadingAvailability(false);
      return;
    }

    const controller = new AbortController();
    let isActive = true;

    setIsLoadingAvailability(true);
    setAvailabilityError('');

    const duration = resolveTreatmentDuration(
      formValues.treatments,
      formValues.treatmentDurationMinutes
    );
    const params = new URLSearchParams({
      date: formValues.date,
      durationMinutes: duration.toString(),
      treatment: formValues.treatments.join(', '),
    });

    getJson<AvailabilityResponse>(`/api/availability?${params.toString()}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!isActive) {
          return;
        }
        setAvailableSlots(response.slots);
        setAvailabilityError(response.closedReason ?? '');
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
  }, [formValues.date, formValues.treatmentDurationMinutes, scheduleInfo]);

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
    if (formValues.treatments.length === 0) {
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
    if (isSubmitting || cooldownSeconds > 0) {
      return 'Kérjük, várjon a következő foglalási próbálkozásig.';
    }
    if (isLoadingAvailability) {
      return 'Kérjük, várja meg, amíg betöltjük az elérhető időpontokat.';
    }
    if (availabilityError) {
      return availabilityError;
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
    ? availabilityError
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
    setCooldownSeconds(15);

    try {
      const resolvedDuration = resolveTreatmentDuration(
        formValues.treatments,
        formValues.treatmentDurationMinutes
      );

      await postJson('/api/appointments', {
        ...formValues,
        treatment: formValues.treatments.join(', '),
        treatmentDurationMinutes: resolvedDuration,
        treatmentPriceFrom: formValues.treatmentPriceFrom,
        note: formValues.notes,
      });

      await postJson('/api/contact', {
        name: formValues.fullName,
        email: formValues.email,
        phone: formValues.phone,
        preferredDay: formValues.date,
        preferredTime: formValues.time,
        message: [
          `Kiválasztott kezelés: ${selectedTreatmentsLabel}`,
          formValues.treatmentPriceFrom ? `Kezelés alapára: ${formValues.treatmentPriceFrom}-tól` : null,
          formValues.treatmentDurationMinutes
            ? `Tervezett kezelés hossza: ${formValues.treatmentDurationMinutes} perc`
            : null,
          `Foglalni kívánt időpont: ${formValues.date} ${formValues.time}`,
          formValues.notes ? `Megjegyzés: ${formValues.notes}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
      });

      setSuccessMessage(
        'Köszönjük, rögzítettük foglalási szándékát! Kérjük, várjon, amíg visszaigazoljuk, hogy az időpont biztosan elérhető.'
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
        </div>
        <fieldset className="treatment-options">
          <legend>Választott kezelések</legend>
          <div className="treatment-options__grid" role="group" aria-label="Választható kezelések">
            {treatmentOptions.map((treatment) => {
              const isSelected = formValues.treatments.includes(treatment.name);

              return (
                <label
                  key={treatment.name}
                  className={`treatment-option${isSelected ? ' treatment-option--selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    name="treatments"
                    value={treatment.name}
                    checked={isSelected}
                    onChange={() => handleTreatmentToggle(treatment.name)}
                  />
                  <div className="treatment-option__content">
                    <span className="treatment-option__name">{treatment.name}</span>
                    <span className="treatment-option__meta">
                      {treatment.basic_price_from ? `${treatment.basic_price_from}-tól` : 'Ár egyeztetés után'}
                      {' • '} {treatment.time_required_in_minutes} perc
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
          <div className="treatment-options__summary" aria-live="polite">
            <p>
              <strong>Kiválasztott kezelések:</strong>{' '}
              {selectedTreatmentsLabel || 'Válasszon egy vagy több kezelést.'}
            </p>
            <p>
              <strong>Kiinduló ár összesen:</strong>{' '}
              {formValues.treatmentPriceFrom ? `${formValues.treatmentPriceFrom}-tól` : '---'}
            </p>
            <p>
              <strong>Tervezett időigény:</strong>{' '}
              {formValues.treatmentDurationMinutes ? `${formValues.treatmentDurationMinutes} perc` : '---'}
            </p>
          </div>
        </fieldset>
        <div className="form__grid form__grid--schedule">
          <label>
            Dátum
            <input
              className={`date-input${isClosedDay ? ' date-input--closed' : ''}`}
              type="date"
              name="date"
              value={formValues.date}
              onChange={(event) => handleChange('date', event.target.value)}
              required
            />
          </label>
          <label className="time-select-label">
            Időpont
            <div className="time-options" role="radiogroup" aria-label="Választható időpontok">
              {availableSlots.length > 0 ? (
                availableSlots.map((slot) => (
                  <button
                    type="button"
                    key={slot}
                    className={`time-option${formValues.time === slot ? ' time-option--selected' : ''}`}
                    onClick={() => handleChange('time', slot)}
                    disabled={isTimeSelectDisabled}
                    aria-pressed={formValues.time === slot}
                  >
                    {slot}
                  </button>
                ))
              ) : (
                <p className="time-options__placeholder">{timeSelectPlaceholder}</p>
              )}
            </div>
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
        <button
          className="btn btn-primary"
          type="submit"
          disabled={isSubmitting || cooldownSeconds > 0 || isLoadingAvailability}
        >
          {isSubmitting ? 'Küldés...' : 'Időpontot kérek'}
        </button>
        {errorMessage && <p className="form__error" role="alert">{errorMessage}</p>}
        {successMessage && <p className="form__success">{successMessage}</p>}
        <p className="form__disclaimer">
          A beérkező foglalások előzetes igénylésnek minősülnek, kollégáink telefonon vagy e-mailben erősítik meg az
          időpontot.
        </p>
      </form>
      {(isSubmitting || cooldownSeconds > 0) && (
        <div className="booking__overlay" aria-live="polite">
          <div className="booking__overlay-content">
            <p>{isSubmitting ? 'Foglalási kérés küldése...' : 'Új kérés indítható hamarosan.'}</p>
            {cooldownSeconds > 0 && <p className="booking__overlay-timer">{cooldownSeconds} mp</p>}
          </div>
        </div>
      )}
    </section>
  );
};

export default BookingSection;
