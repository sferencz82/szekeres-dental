import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { ContactRequest, ApiResponse } from '../types';

const contactRouter = Router();

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

const formatContactHtml = (payload: ContactRequest): string => `
  <h2>Új kapcsolatfelvétel érkezett</h2>
  <p><strong>Név:</strong> ${payload.name}</p>
  <p><strong>E-mail:</strong> ${payload.email}</p>
  <p><strong>Telefon:</strong> ${payload.phone ?? 'N/A'}</p>
  <p><strong>Preferált nap:</strong> ${payload.preferredDay ?? 'N/A'}</p>
  <p><strong>Preferált idő:</strong> ${payload.preferredTime ?? 'N/A'}</p>
  <p><strong>Üzenet:</strong></p>
  <p>${payload.message}</p>
`;

contactRouter.post(
  '/',
  async (
    req: Request<unknown, ApiResponse, ContactRequest>,
    res: Response<ApiResponse>
  ) => {
    const { name, email, message } = req.body;
    const missing: string[] = [];

    if (!name) missing.push('name');
    if (!email) missing.push('email');
    if (!message) missing.push('message');

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

    try {
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: process.env.CONTACT_TO_EMAIL,
        subject: 'Új kapcsolatfelvétel a weboldalról – Szekeres Dental',
        html: formatContactHtml(req.body),
      });

      return res.json({ success: true });
    } catch (error) {
      console.error('Failed to send contact email', error);
      return res.status(500).json({
        success: false,
        error: 'Unable to send contact request at this time',
      });
    }
  }
);

export default contactRouter;
