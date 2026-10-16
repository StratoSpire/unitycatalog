import { UserManager, WebStorageStateStore } from 'oidc-client-ts';
import type { OidcMetadata } from 'oidc-client-ts';
import { getConfig } from '../config';

let _userManager: UserManager | null = null;
let _initPromise: Promise<UserManager> | null = null;

/**
 * Returns the OIDC UserManager, initializing it on first call.
 * Initialization fetches the OIDC discovery document through our nginx proxy
 * (at /_oidc/) to avoid CORS issues, then rewrites fetch-based endpoints
 * (token, userinfo, jwks) to also go through the proxy. The authorization
 * endpoint is kept as-is since it's a browser redirect, not a fetch.
 */
export function getUserManager(): Promise<UserManager> {
  if (_userManager) return Promise.resolve(_userManager);
  if (_initPromise) return _initPromise;

  _initPromise = initUserManager();
  return _initPromise;
}

async function initUserManager(): Promise<UserManager> {
  const config = getConfig();
  const authority = config.oidcAuthority.replace(/\/$/, '');

  // Fetch OIDC discovery through our nginx proxy to avoid CORS
  const response = await fetch('/_oidc/.well-known/openid-configuration');
  if (!response.ok) {
    throw new Error(
      `Failed to fetch OIDC discovery: ${response.status} ${response.statusText}`,
    );
  }
  const metadata: OidcMetadata = await response.json();

  // Rewrite endpoints that are fetched from the browser (CORS-sensitive)
  // to go through our nginx proxy. The authorization_endpoint is a browser
  // redirect (no CORS issue), so we leave it pointing at the real provider.
  const rewrite = (url: string) => url.replace(authority, '/_oidc');

  if (metadata.token_endpoint) {
    metadata.token_endpoint = rewrite(metadata.token_endpoint);
  }
  if (metadata.userinfo_endpoint) {
    metadata.userinfo_endpoint = rewrite(metadata.userinfo_endpoint);
  }
  if (metadata.jwks_uri) {
    metadata.jwks_uri = rewrite(metadata.jwks_uri);
  }
  if (metadata.end_session_endpoint) {
    metadata.end_session_endpoint = rewrite(metadata.end_session_endpoint);
  }
  // Keep authorization_endpoint and issuer as-is

  _userManager = new UserManager({
    authority: config.oidcAuthority,
    client_id: config.oidcClientId,
    redirect_uri: `${window.location.origin}/callback`,
    post_logout_redirect_uri: window.location.origin,
    response_type: 'code',
    scope: config.oidcScopes || 'openid profile email',
    userStore: new WebStorageStateStore({ store: window.sessionStorage }),
    automaticSilentRenew: false,
    metadata,
  });

  return _userManager;
}
