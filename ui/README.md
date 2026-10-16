# Unity Catalog UI

Unity Catalog UI is an intuitive user interface designed to manage and interact with Unity Catalog. It facilitates handling data permissions, auditing, and resource discovery in a user-friendly manner. Through this UI, users can efficiently view, create, update, and delete resources within the Unity Catalog server.

For more details on how to use the Unity Catalog UI, please refer to the [UI Documentation](https://docs.unitycatalog.io/usage/ui/).

![UC UI](../docs/assets/images/uc-ui.png)

# Prerequisite

Node: https://nodejs.org/en/download/package-manager

Bun: https://bun.com/docs/installation

Bun is the package manager and script runner for this project. The app itself is built and served by
[Vite](https://vite.dev/) running on Node.

## Get started

Spin up a localhost Unity Catalog server (e.g., `./bin/start-uc-server`), see https://github.com/unitycatalog/unitycatalog/blob/main/README.md#run-the-uc-server

Then in the project directory, you can run:

### `bun install`

Install all the necessary dependencies

### `bun run start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### Other scripts

- `bun run build` - type-check and build the production bundle into `build/`
- `bun run preview` - serve the production build locally
- `bun run format` - apply Prettier fixes
- `bun run test:format` - check formatting without writing changes (this is what CI runs)
- `bun run generate` - regenerate the API types from the OpenAPI specs in `../api`

> Note: If you are installing behind a corporate proxy (npm-proxy) you will need
> to **run the following** script before committing changes
- `bun run scripts/clean-bun-lock.ts` - remove internal proxy urls from the bun lock. This will allow the github workflows to fetch packages from external npm.

Always invoke these through `bun run`. `build` and `test` are Bun's own subcommands, so `bun build` and `bun test`
would run Bun's bundler and test runner instead of the scripts above.

### Authenticate and Login

This UI signs in through a generic OpenID Connect (OIDC) provider (Authorization Code + PKCE).
Configuration is read at runtime from `window.__UC_CONFIG__`, which is written to `public/config.js`:

| Field | Meaning |
| --- | --- |
| `apiUrl` | Backend API base URL. Empty string means same-origin. |
| `authEnabled` | Set to `true` to show the login UI. |
| `oidcAuthority` | OIDC provider base URL; must expose `/.well-known/openid-configuration`. |
| `oidcClientId` | Public client ID registered with the provider. |
| `oidcScopes` | Space-separated scopes (default `openid profile email`). |

For local development, edit `ui/public/config.js` directly, then restart the dev server
(`bun run start`).

In production the same values come from container environment variables (`UC_AUTH_ENABLED`,
`UC_OIDC_AUTHORITY`, `UC_OIDC_CLIENT_ID`, `UC_OIDC_SCOPES`, `UC_API_URL`); `docker-entrypoint.sh`
renders them into `config.js` at startup. Authentication must also be enabled on the server side,
and users must exist in the users table.

## References

This project has been merged into the main Unity Catalog repository. Per [Merging unitycatalog-ui repo into unitycatalog (main) repo (#349)](https://github.com/unitycatalog/unitycatalog/discussions/349).