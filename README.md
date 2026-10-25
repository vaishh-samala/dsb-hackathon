# Sandbox Studio

Sandbox Studio is a React and Express demo for reviewing developer sandbox requests, applying policy checks, recording administrator decisions, and producing setup reports.

## Requirements

- Node.js 20.19+ (or 22.12+) and npm
- Optional: a server-side `GEMINI_API_KEY` for Gemini-generated setup plans

## Run locally

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The welcome screen offers demo Developer and Administrator roles; it is not production authentication.

## Build and deploy

Build the client assets, then run the Express server in production mode:

```sh
npm install
npm run build
NODE_ENV=production npm start
```

Deploy the repository to a Node.js host that can run the production start command and serve the application on port 3000. Configure `GEMINI_API_KEY` only as a server-side secret when Gemini planning is needed. The app falls back to its deterministic planner when the key is absent or invalid. Never add the key to frontend configuration.

## Demo behavior and boundaries

- Setup requests, sandbox allocations, verification probes, and audit entries are held in memory and reset when the server restarts. They are simulator outputs; no real repository is cloned and no container is provisioned.
- The simulated workflow runs in this order: collect request, discover matching sandbox records, generate a plan, apply deterministic policy checks, wait for administrator review, record simulated execution, return a configured smoke-test result, and generate a report with a SHA-256 content digest. The digest is not a digital signature, and reports are not immutable.
- POL-001 blocks production targets; POL-004 blocks requests for real production customer data. An administrator can approve, reject, or request changes. Developers can resubmit a change-requested setup under the same request ID; policy checks run again and stale execution, verification, and report results are cleared.
- The n8n workflow JSON is included as an integration artifact. The app's n8n bridge simulates execution; it does not contact an n8n service.
- Demo role selection is not an identity provider. Approval checks are enforced by the application API, but this demo is not a substitute for production authentication or authorization infrastructure.
- The API key, if configured, is read only by the server. Generated manifests sanitize credential-like values before returning them.
