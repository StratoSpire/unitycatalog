export interface AppConfig {
  apiUrl: string;
  authEnabled: boolean;
  oidcAuthority: string;
  oidcClientId: string;
  oidcScopes: string;
}

declare global {
  interface Window {
    __UC_CONFIG__?: Partial<AppConfig>;
  }
}

const defaults: AppConfig = {
  apiUrl: '',
  authEnabled: false,
  oidcAuthority: '',
  oidcClientId: '',
  oidcScopes: 'openid profile email',
};

let _config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!_config) {
    _config = { ...defaults, ...window.__UC_CONFIG__ };
  }
  return _config;
}
