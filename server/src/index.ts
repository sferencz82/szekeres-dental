import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import contactRouter from './routes/contact';
import appointmentsRouter from './routes/appointments';
import availabilityRouter from './routes/availability';
import { ApiResponse } from './types';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const PORT = Number(process.env.PORT) || 4000;
const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000'];

const app = express();

const apiBaseUrl = process.env.API_BASE_URL || `http://localhost:${PORT}`;

const swaggerDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Szekeres Dental API',
    version: '1.0.0',
    description:
      'REST API endpoints that power the Szekeres Dental marketing site. Use these endpoints to submit contact requests, request an appointment slot or list availability for a specific day.',
  },
  servers: [
    {
      url: apiBaseUrl,
      description: 'Configured API base URL',
    },
  ],
  tags: [
    { name: 'Contact', description: 'Send general contact requests' },
    { name: 'Appointments', description: 'Create appointment requests' },
    { name: 'Availability', description: 'Check open time slots for a specific day' },
  ],
  components: {
    schemas: {
      ApiSuccess: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            enum: [true],
            description: 'Indicates the operation was successful.',
          },
        },
        required: ['success'],
      },
      ApiError: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            enum: [false],
            description: 'Indicates the operation failed.',
          },
          error: {
            type: 'string',
            description: 'Localized error message.',
          },
        },
        required: ['success', 'error'],
      },
      ContactRequest: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the sender.' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          preferredDay: { type: 'string', description: 'Preferred day to visit.' },
          preferredTime: { type: 'string', description: 'Preferred time to visit.' },
          message: { type: 'string', description: 'Free-form message from the sender.' },
        },
        required: ['name', 'email', 'message'],
      },
      AppointmentRequest: {
        type: 'object',
        properties: {
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          phone: { type: 'string' },
          treatment: { type: 'string', description: 'Optional treatment preference.' },
          date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          time: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          note: { type: 'string', description: 'Optional note for the staff.' },
        },
        required: ['fullName', 'email', 'phone', 'date', 'time'],
      },
      AvailabilityResponse: {
        type: 'object',
        properties: {
          date: { type: 'string', example: '2024-06-01' },
          slots: {
            type: 'array',
            description: 'List of available 30 minute slots (HH:MM).',
            items: { type: 'string', example: '09:00' },
          },
        },
        required: ['date', 'slots'],
      },
    },
  },
  paths: {
    '/api/contact': {
      post: {
        tags: ['Contact'],
        summary: 'Submit a contact form message',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ContactRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Contact request accepted.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } },
            },
          },
          400: {
            description: 'Validation error.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiError' } },
            },
          },
          500: {
            description: 'Server or email configuration error.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiError' } },
            },
          },
        },
      },
    },
    '/api/appointments': {
      post: {
        tags: ['Appointments'],
        summary: 'Submit an appointment booking request',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AppointmentRequest' },
            },
          },
        },
        responses: {
          200: {
            description: 'Appointment request accepted.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiSuccess' } },
            },
          },
          400: {
            description: 'Validation error.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiError' } },
            },
          },
          500: {
            description: 'Server or email configuration error.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiError' } },
            },
          },
        },
      },
    },
    '/api/availability': {
      get: {
        tags: ['Availability'],
        summary: 'List available appointment slots for a specific day',
        parameters: [
          {
            name: 'date',
            in: 'query',
            required: true,
            description: 'Date formatted as YYYY-MM-DD.',
            schema: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          },
        ],
        responses: {
          200: {
            description: 'List of available slots for the given date.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/AvailabilityResponse' },
              },
            },
          },
          400: {
            description: 'Invalid or missing date query parameter.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ApiError' } },
            },
          },
        },
      },
    },
  },
};

const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Szekeres Dental API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
    <style>
      body { margin: 0; padding: 0; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/api-docs.json',
          dom_id: '#swagger-ui',
          docExpansion: 'none',
        });
      };
    </script>
  </body>
</html>`;

app.use(
  cors({
    origin: allowedOrigins,
  })
);
app.use(express.json());

app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.json(swaggerDocument);
});

app.get('/api-docs', (_req: Request, res: Response) => {
  res.type('text/html').send(swaggerHtml);
});

app.use('/api/contact', contactRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/availability', availabilityRouter);

app.use(
  (
    err: Error,
    _req: Request,
    res: Response<ApiResponse>,
    _next: NextFunction
  ) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
);

app.listen(PORT, () => {
  console.log(`Szekeres Dental API listening on port ${PORT}`);
});
