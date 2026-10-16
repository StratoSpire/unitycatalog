#!/bin/sh
set -e

# Generate runtime config from environment variables
cat > /usr/share/nginx/html/config.js <<EOF
window.__UC_CONFIG__ = {
  apiUrl: "${UC_API_URL:-}",
  authEnabled: ${UC_AUTH_ENABLED:-false},
  oidcAuthority: "${UC_OIDC_AUTHORITY:-}",
  oidcClientId: "${UC_OIDC_CLIENT_ID:-}",
  oidcScopes: "${UC_OIDC_SCOPES:-openid profile email}",
};
EOF

# Use OIDC authority as the proxy target (strip trailing slash if present)
export OIDC_PROXY_URL="${UC_OIDC_AUTHORITY%/}"

# Default to a placeholder if not set (nginx won't start with an empty upstream)
if [ -z "$OIDC_PROXY_URL" ]; then
  export OIDC_PROXY_URL="http://localhost:9999"
fi

# Substitute environment variables in nginx config template
envsubst '${API_URL} ${OIDC_PROXY_URL}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g 'daemon off;'
