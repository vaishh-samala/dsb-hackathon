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

- Sign-in is demo-only. The server issues an HttpOnly, SameSite demo session for one of the two configured demo identities. Google OAuth is not configured, and there is no real-user authentication mode; do not deploy this demo session mechanism as production authentication.
- Developer setup and activity API responses are scoped to that demo developer identity. Administrator demo sessions can inspect organization-wide synthetic demo records. All records and sessions are in memory and reset when the server restarts.
- Repository URLs and branch names are entered manually. No GitHub connection or live branch-listing/branch-validation integration is configured.
- Developers can revise a request under the same request ID after an administrator returns it with “Request Changes.” General editing of already approved or completed environments is not supported.
- Setup requests, sandbox allocations, verification probes, and audit entries are held in memory and reset when the server restarts. They are simulator outputs; no real repository is cloned and no container is provisioned.
- The simulated workflow runs in this order: collect request, discover matching sandbox records, generate a plan, apply deterministic policy checks, wait for administrator review, record simulated execution, return a configured smoke-test result, and generate a report with a SHA-256 content digest. The digest is not a digital signature, and reports are not immutable.
- The official test-case section contains only TC1–TC4. All remain “Not Run” because there is no case-specific execution runner; legacy canned scenario records are not treated as test results. Production execution is independently guarded by POL-001. Generated reports run a credential-pattern scan after redaction and record its result; this check does not turn simulated provisioning into real infrastructure evidence.
- The interactive setup graph visualizes the requested dashboard-to-planner, adapter, policy/approval, provisioning-or-decision, evidence, and manifest/test-lab architecture against the actual setup state. This repository uses React/Vite and Express, not Next.js or FastAPI. Repository/sandbox adapters, provisioning, registry entries, and smoke-login results are simulated; the graph labels them accordingly. The audit/evidence store is in-memory.
- POL-001 blocks production targets; POL-004 blocks requests for real production customer data. An administrator can approve, reject, or request changes. Developers can resubmit a change-requested setup under the same request ID; policy checks run again and stale execution, verification, and report results are cleared.
- The n8n workflow JSON is included as an integration artifact. The app's n8n bridge simulates execution; it does not contact an n8n service.
- Demo role selection is not an identity provider. Approval checks are enforced by the application API, but this demo is not a substitute for production authentication or authorization infrastructure.
- The API key, if configured, is read only by the server. Generated manifests sanitize credential-like values before returning them.
