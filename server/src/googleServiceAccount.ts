import crypto from 'crypto';
import fs from 'fs';

const readKeyFile = (filePath: string): { email: string; privateKey: string } => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(raw) as {
    client_email?: string;
    private_key?: string;
  };

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('Service account JSON is missing client_email or private_key');
  }

  return {
    email: parsed.client_email,
    privateKey: parsed.private_key.replace(/\\n/g, '\n'),
  };
};

const calendarScope = 'https://www.googleapis.com/auth/calendar';
const tokenUrl = 'https://oauth2.googleapis.com/token';

const serviceAccountJsonPath = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

const { email: serviceAccountEmail, privateKey: serviceAccountPrivateKey } =
  serviceAccountJsonPath
    ? readKeyFile(serviceAccountJsonPath)
    : { email: undefined, privateKey: undefined };

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
