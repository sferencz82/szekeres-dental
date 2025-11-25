import './env';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const parseServiceAccountJson = (raw: string): { email: string; privateKey: string } => {
  const parsed = JSON.parse(raw) as { client_email?: string; private_key?: string };

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('Service account JSON is missing client_email or private_key');
  }

  return {
    email: parsed.client_email,
    privateKey: parsed.private_key.replace(/\\n/g, '\n'),
  };
};

const readKeyFile = (filePath: string): { email: string; privateKey: string } =>
  parseServiceAccountJson(fs.readFileSync(filePath, 'utf8'));

const resolveServiceAccountCredentials = (): { email?: string; privateKey?: string } => {
  const envValue = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  console.log(`This is the envValue: ${envValue}`);

  if (!envValue) {
    return { email: undefined, privateKey: undefined };
  }

  const trimmed = envValue.trim();
  console.log(`This is the trimmed: ${trimmed}`);

  // 1) Raw JSON directly in env var
  if (trimmed.startsWith('{')) {
    return parseServiceAccountJson(trimmed);
  }

  // 2) Treat as a file path if it exists
  const possiblePath = path.resolve(trimmed);
  console.log(`This is the possiblePath: ${possiblePath}`);
  if (fs.existsSync(possiblePath)) {
    console.log(`Treating GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY as file path: ${possiblePath}`);
    return readKeyFile(possiblePath);
  }

  // 3) Try base64-encoded JSON
  try {
    const decoded = Buffer.from(trimmed, 'base64').toString('utf8');
    console.log(`This is the decoded: ${decoded}`);

    if (decoded.trim().startsWith('{')) {
      return parseServiceAccountJson(decoded);
    }
  } catch (err) {
    console.log('Failed to decode GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY as base64:', err);
    // fall through to error below
  }

  throw new Error(
    'Google service account credentials are missing or invalid. ' +
      'Provide a JSON key file path, raw JSON, or base64-encoded JSON in GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.'
  );
};

const calendarScope = 'https://www.googleapis.com/auth/calendar';
const tokenUrl = 'https://oauth2.googleapis.com/token';

process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
const serviceAccountJsonPath = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

console.log(`jwt file path: ${serviceAccountJsonPath}`)

const { email: serviceAccountEmail, privateKey: serviceAccountPrivateKey } =
  resolveServiceAccountCredentials();

export const hasServiceAccountCredentials = Boolean(
  serviceAccountEmail && serviceAccountPrivateKey
);

export const calendarId = process.env.GOOGLE_CALENDAR_ID;
export const calendarTimeZone =
  process.env.GOOGLE_CALENDAR_TIMEZONE || 'Europe/Budapest';

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

const base64UrlEncode = (input: string | Buffer): string =>
  Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const createJwtAssertion = (scope: string): string => {
  if (!serviceAccountEmail || !serviceAccountPrivateKey) {
    throw new Error('Google service account credentials are missing');
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountEmail,
    scope,
    aud: tokenUrl,
    iat: issuedAt,
    exp: issuedAt + 3600,
  };

  const header = { alg: 'RS256', typ: 'JWT' };
  const signingInput = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(payload)
  )}`;

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signingInput);
  const signature = signer.sign(serviceAccountPrivateKey, 'base64');
  const encodedSignature = signature
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  return `${signingInput}.${encodedSignature}`;
};

const requestAccessToken = async (): Promise<CachedToken> => {
  const assertion = createJwtAssertion(calendarScope);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion,
  });

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to obtain Google access token: ${response.status} ${response.statusText} - ${errorBody}`
    );
  }

  const { access_token: accessToken, expires_in: expiresIn } =
    (await response.json()) as {
      access_token: string;
      expires_in: number;
    };

  if (!accessToken || !expiresIn) {
    throw new Error('Google token response is missing required fields');
  }

  const now = Math.floor(Date.now() / 1000);
  return { token: accessToken, expiresAt: now + expiresIn - 60 };
};

export const getServiceAccountAccessToken = async (): Promise<string> => {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && cachedToken.expiresAt > now) {
    return cachedToken.token;
  }

  cachedToken = await requestAccessToken();
  return cachedToken.token;
};
