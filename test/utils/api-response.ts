import { type Response } from 'supertest';

/**
 * Recursive shape for the JSON payload returned by the API. Allows arbitrary
 * nested property and index access in assertions (e.g. `data.items[0].name`)
 * while staying type-safe (no `any`), so the e2e specs satisfy the
 * `no-unsafe-*` lint rules without weakening assertions.
 */
export interface ApiData {
  [key: string]: ApiData;
  [index: number]: ApiData;
}

/** Standard `BaseResponse` envelope used by every JSON endpoint. */
export interface ApiBody {
  success: boolean;
  message?: string;
  data: ApiData;
}

/** Reads the typed envelope from a supertest response (whose `.body` is `any`). */
export function apiBody(res: Response): ApiBody {
  return res.body as ApiBody;
}
