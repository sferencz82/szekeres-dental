import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';
import { AppointmentRequest, ApiResponse, BookingRequest } from '../types';
import {
  calendarId,
  calendarTimeZone,
  hasServiceAccountCredentials,
  getServiceAccountAccessToken,
} from '../googleServiceAccount';
import treatmentDefinitions from '../../../shared/treatments.json';

interface TreatmentDefinition {
  name: string;
  time_required_in_minutes: number;
  basic_price_from: string;
}

const defaultTreatmentDurationMinutes = 30;

const getTreatmentDefinition = (name?: string): TreatmentDefinition | undefined =>
  (name ? (treatmentDefinitions as TreatmentDefinition[]).find((option) => option.name === name) : undefined);

const appointmentsRouter = Router();

// In-memory store for incoming appointment requests. In a production system,
// you would persist these records in a database such as PostgreSQL or MongoDB
// by replacing this array with data-access functions that insert and query
// records through an ORM or query builder.
export const bookingRequests: BookingRequest[] = [];

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
});

const formatAppointmentHtml = (payload: BookingRequest): string => {
  const lengthMinutes = payload.treatmentDurationMinutes ?? defaultTreatmentDurationMinutes;
  const price = payload.treatmentPriceFrom ? `${payload.treatmentPriceFrom}-tól` : 'N/A';

  return `
    <h2>Új időpontfoglalás érkezett</h2>
    <p><strong>Név:</strong> ${payload.fullName}</p>
    <p><strong>E-mail:</strong> ${payload.email}</p>
    <p><strong>Telefon:</strong> ${payload.phone}</p>
    <p><strong>Kezelés:</strong> ${payload.treatment ?? 'N/A'}</p>
    <p><strong>Alapár:</strong> ${price}</p>
    <p><strong>Tervezett időtartam:</strong> ${lengthMinutes} perc</p>
    <p><strong>Dátum:</strong> ${payload.date}</p>
    <p><strong>Idő:</strong> ${payload.time}</p>
    <p><strong>Megjegyzés:</strong> ${payload.note ?? 'N/A'}</p>
    <p><strong>Érkezett:</strong> ${payload.receivedAt.toISOString()}</p>
  `;
};

const formatPatientConfirmationHtml = (payload: BookingRequest): string => {
  const lengthMinutes = payload.treatmentDurationMinutes ?? defaultTreatmentDurationMinutes;
  const price = payload.treatmentPriceFrom ? `${payload.treatmentPriceFrom}-tól` : 'véglegesítés alatt';
  return `
    <h2>Köszönjük a foglalási igényét!</h2>
    <p>Kedves ${payload.fullName.split(' ')[0] || 'Páciensünk'},</p>
    <p>Foglalási szándékát rögzítettük. Kollégáink ellenőrzik a választott időpont elérhetőségét, és hamarosan felveszik Önnel a kapcsolatot telefonon vagy e-mailben.</p>
    <ul>
      <li><strong>Dátum:</strong> ${payload.date}</li>
      <li><strong>Időpont:</strong> ${payload.time}</li>
      <li><strong>Kezelés:</strong> ${payload.treatment ?? 'N/A'}</li>
      <li><strong>Alapár:</strong> ${price}</li>
      <li><strong>Tervezett időtartam:</strong> ${lengthMinutes} perc</li>
    </ul>
    <p>Amennyiben a fenti időpont mégsem megfelelő, kérjük jelezze ezt a válaszlevélben.</p>
    <p>Üdvözlettel,<br />Szekeres Dental csapata</p>
  `;
};

const formatDateTime = (
  date: string,
  time: string,
  addMinutes = 0
): { date: string; time: string } => {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);

  if ([year, month, day, hour, minute].some((value) => Number.isNaN(value))) {
    throw new Error('Invalid date or time supplied for calendar event');
  }

  const base = new Date(Date.UTC(year, month - 1, day, hour, minute));
  base.setUTCMinutes(base.getUTCMinutes() + addMinutes);

  const pad = (value: number) => value.toString().padStart(2, '0');

  return {
    date: `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(
      base.getUTCDate()
    )}`,
    time: `${pad(base.getUTCHours())}:${pad(base.getUTCMinutes())}`,
  };
};

const createCalendarEvent = async (booking: BookingRequest): Promise<void> => {
  if (!calendarId) {
    return;
  }

  if (!hasServiceAccountCredentials) {
    console.warn(
      'Google Calendar ID configured but GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is missing; skipping calendar event creation.'
    );
    return;
  }

  const accessToken = await getServiceAccountAccessToken();
  const { date: endDate, time: endTime } = formatDateTime(
    booking.date,
    booking.time,
    booking.treatmentDurationMinutes ?? defaultTreatmentDurationMinutes
  );

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(
      calendarId
    )}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: `Időpontfoglalás: ${booking.fullName}`,
        description:
          [
            booking.note || 'Foglalás a weboldalról (Google szolgáltatási fiók által mentve).',
            booking.treatment ? `Kezelés: ${booking.treatment}` : null,
            booking.treatmentPriceFrom ? `Alapár: ${booking.treatmentPriceFrom}-tól` : null,
            booking.treatmentDurationMinutes
              ? `Tervezett időtartam: ${booking.treatmentDurationMinutes} perc`
              : null,
          ]
            .filter(Boolean)
            .join('\n'),
        attendees: [],
        start: {
          dateTime: `${booking.date}T${booking.time}:00`,
          timeZone: calendarTimeZone,
        },
        end: {
          dateTime: `${endDate}T${endTime}:00`,
          timeZone: calendarTimeZone,
        },
        extendedProperties: {
          private: {
            bookingId: booking.id,
            phone: booking.phone,
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to create Google Calendar event: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }
};

appointmentsRouter.post(
  '/',
  async (
    req: Request<unknown, ApiResponse, AppointmentRequest>,
    res: Response<ApiResponse>
  ) => {
    const { fullName, email, phone, date, time } = req.body;
    const missing = [
      !fullName && 'fullName',
      !email && 'email',
      !phone && 'phone',
      !date && 'date',
      !time && 'time',
    ].filter(Boolean) as string[];

    if (missing.length) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    if (!process.env.CONTACT_TO_EMAIL) {
      return res.status(500).json({
        success: false,
        error: 'Email configuration is incomplete',
      });
    }

    const matchedTreatment = getTreatmentDefinition(req.body.treatment);

    const booking: BookingRequest = {
      ...req.body,
      treatment: req.body.treatment ?? matchedTreatment?.name,
      treatmentDurationMinutes:
        matchedTreatment?.time_required_in_minutes ??
        req.body.treatmentDurationMinutes ??
        defaultTreatmentDurationMinutes,
      treatmentPriceFrom: matchedTreatment?.basic_price_from ?? req.body.treatmentPriceFrom,
      id: randomUUID(),
      receivedAt: new Date(),
    };

    bookingRequests.push(booking);

    try {
      await createCalendarEvent(booking);
    } catch (error) {
      console.error('Failed to add booking to Google Calendar', error);
      return res.status(500).json({
        success: false,
        error: 'Hiba történt a naptár frissítésekor. Próbálja meg később.',
      });
    }

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.CONTACT_TO_EMAIL,
        subject: 'Új időpontfoglalás a weboldalról – Szekeres Dental',
        html: formatAppointmentHtml(booking),
      });

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: booking.email,
        subject: 'Időpontfoglalási igényed megérkezett – Szekeres Dental',
        html: formatPatientConfirmationHtml(booking),
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Failed to send appointment email', error);
      return res.status(500).json({
        success: false,
        error: 'Unable to send appointment request at this time',
      });
    }
  }
);

export default appointmentsRouter;
