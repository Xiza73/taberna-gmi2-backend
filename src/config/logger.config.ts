import { type IncomingMessage } from 'http';
import { type Params } from 'nestjs-pino';
import * as geoip from 'geoip-lite';

// Query params que NUNCA deben quedar en los logs.
const SENSITIVE_QUERY_KEYS = new Set([
  'token',
  'refresh_token',
  'code',
  'password',
]);

function sanitizeUrl(originalUrl?: string): string {
  if (!originalUrl) {
    return '';
  }
  const queryIdx = originalUrl.indexOf('?');
  if (queryIdx === -1) {
    return originalUrl;
  }
  const pathPart = originalUrl.slice(0, queryIdx);
  const queryPart = originalUrl.slice(queryIdx + 1);
  if (!queryPart) {
    return originalUrl;
  }
  const sanitizedPairs = queryPart.split('&').map((pair) => {
    const eqIdx = pair.indexOf('=');
    const rawKey = eqIdx === -1 ? pair : pair.slice(0, eqIdx);
    let decodedKey = rawKey;
    try {
      decodedKey = decodeURIComponent(rawKey);
    } catch {
      decodedKey = rawKey;
    }
    if (SENSITIVE_QUERY_KEYS.has(decodedKey.toLowerCase())) {
      return `${rawKey}=[REDACTED]`;
    }
    return pair;
  });
  return `${pathPart}?${sanitizedPairs.join('&')}`;
}

// No extendemos IncomingMessage para evitar choques con las augmentations
// de tipos de pino-http (req.id). Solo describimos lo que leemos y casteamos.
interface RequestExtras {
  id?: string | number;
  ip?: string;
  url?: string;
  method?: string;
  user?: { id?: string };
  socket?: { remoteAddress?: string };
}

// Logging estructurado JSON a stdout. Railway lo captura gratis y permite
// búsqueda/filtro básico. Si más adelante quieres dashboards tipo Kibana,
// conecta un Log Drain a Axiom desde Railway — sin tocar este código.
export function buildLoggerParams(isProduction: boolean): Params {
  return {
    pinoHttp: {
      level: isProduction ? 'info' : 'debug',
      // En dev: salida bonita y legible. En prod: JSON crudo (lo que Railway
      // y cualquier drain esperan).
      transport: isProduction
        ? undefined
        : {
            target: 'pino-pretty',
            options: { singleLine: true, translateTime: 'SYS:standard' },
          },
      autoLogging: true,
      // No logueamos headers (evita filtrar Authorization/Cookies); solo
      // método + URL saneada.
      serializers: {
        req(req: IncomingMessage) {
          const r = req as unknown as RequestExtras;
          return { id: r.id, method: r.method, url: sanitizeUrl(r.url) };
        },
      },
      // Enriquecemos cada log de request con userId + geolocalización por IP.
      customProps(req: IncomingMessage) {
        const r = req as unknown as RequestExtras;
        const rawIp = r.ip ?? r.socket?.remoteAddress ?? '';
        const ip = rawIp.replace('::ffff:', '');
        const props: Record<string, unknown> = {
          userId: r.user?.id ?? null,
          ip: ip || null,
        };
        if (ip) {
          const geo = geoip.lookup(ip);
          if (geo) {
            props.city = geo.city || null;
            props.region = geo.region || null;
            props.country = geo.country || null;
            if (geo.ll) {
              props.location = { lat: geo.ll[0], lon: geo.ll[1] };
            }
          }
        }
        return props;
      },
    },
  };
}
