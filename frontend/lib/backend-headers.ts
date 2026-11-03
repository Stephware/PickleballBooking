import { isIP } from 'node:net';

/** Trust the configured deployment origin, and only an explicitly trusted ingress IP. */
export function backendHeaders(incoming: Headers, config: NodeJS.ProcessEnv = process.env): Headers {
  const result = new Headers();
  if (config.APP_ORIGIN) {
    const scheme = new URL(config.APP_ORIGIN).protocol;
    if (scheme === 'https:' || scheme === 'http:')
      result.set('X-Forwarded-Proto', scheme.slice(0, -1));
  }
  // The ingress must REPLACE this header; public direct access to Next must be blocked.
  const ip = incoming.get('X-Forwarded-For')?.trim();
  if (config.TRUST_PROXY_HEADERS === '1' && ip && isIP(ip))
    result.set('X-Forwarded-For', ip);
  return result;
}
