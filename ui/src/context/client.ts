import axios from 'axios';
import { getConfig } from '../config';
import { UC_API_PREFIX } from '../utils/constants';

/**
 * The singleton client instance with `baseURL`.
 * `apiUrl` is the runtime-configured backend base (empty = same-origin, proxied
 * by Vite in dev and nginx in production). Auth is cookie-based (the server sets
 * an HttpOnly session cookie during the OIDC token exchange), so there is no
 * Authorization header.
 */
export const CLIENT = axios.create({
  baseURL: `${getConfig().apiUrl}${UC_API_PREFIX}`,
  headers: {
    'Content-type': 'application/json',
  },
});
