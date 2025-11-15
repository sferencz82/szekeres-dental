import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';
import { AppointmentRequest, ApiResponse, BookingRequest } from '../types';

const appointmentsRouter = Router();

// In-memory store for incoming appointment requests. In a production system,
// you would persist these records in a database such as PostgreSQL or MongoDB
// by replacing this array with data-access functions that insert and query
// records through an ORM or query builder.
const bookingRequests: BookingRequest[] = [];

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

const formatAppointmentHtml = (payload: BookingRequest): string => `
  <h2>Új időpontfoglalás érkezett</h2>
  <p><strong>Név:</strong> ${payload.fullName}</p>
  <p><strong>E-mail:</strong> ${payload.email}</p>
  <p><strong>Telefon:</strong> ${payload.phone}</p>
  <p><strong>Kezelés:</strong> ${payload.treatment ?? 'N/A'}</p>
  <p><strong>Dátum:</strong> ${payload.date}</p>
  <p><strong>Idő:</strong> ${payload.time}</p>
  <p><strong>Megjegyzés:</strong> ${payload.note ?? 'N/A'}</p>
  <p><strong>Érkezett:</strong> ${payload.receivedAt.toISOString()}</p>
`;

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

    const booking: BookingRequest = {
      ...req.body,
      id: randomUUID(),
      receivedAt: new Date(),
    };

    bookingRequests.push(booking);

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.CONTACT_TO_EMAIL,
        subject: 'Új időpontfoglalás a weboldalról – Szekeres Dental',
        html: formatAppointmentHtml(booking),
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
