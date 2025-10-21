import { dirname } from 'path';
import { fileURLToPath } from 'url';

const rootDir = dirname(fileURLToPath(import.meta.url));

const port = process.env.NEXT_DEV_PORT || '3001';
const lan = process.env.LAN_IP || '192.168.77.222';
// Default to permissive origins in dev to support LAN devices
// You can restrict via NEXT_ALLOWED_DEV_ORIGINS if desired
const defaultAllowed = [
  'http://*',
  'https://*',
];

const envAllowedRaw = (process.env.NEXT_ALLOWED_DEV_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const allowAll = envAllowedRaw.includes('*');
const envAllowed = allowAll ? ['http://*', 'https://*'] : envAllowedRaw;

const nextConfig: any = {
  turbopack: {
    root: rootDir,
  },
  // In dev, permit broad origins to avoid blocked cross-origin fetches from LAN
  allowedDevOrigins: envAllowed.length ? envAllowed : defaultAllowed,
};

export default nextConfig;
