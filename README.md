# WhatsApp Web linking — separate staging experiment

**Private, experimental, not production-ready. Do not deploy, connect a real account, use production data, or expose to the Internet.** No live Supabase or WhatsApp pairing, chat synchronization, reconnection or logout has been tested. Unofficial linked-device software may restrict or block a WhatsApp account. This independent project derives its worker from the isolated lab in [Rada PR #8](https://github.com/techchap4/whatsapp/pull/8); it does not change or access Rada.

## What exists

A standalone local browser UI signs into Supabase Auth with an existing staging email/password account, holds its access token only in page memory, requests a phone pairing code, and displays status and limited received text/captions. The separate Node worker uses Baileys, verifies each bearer token with the configured Supabase Auth `/auth/v1/user`, checks an exact browser origin, and scopes in-memory sockets, Signal keys and chats by the verified Supabase user ID; callers cannot choose the owner. Auth errors fail closed. API responses use no-store; message text is rendered as text, not HTML. The UI clears its code on timeout or sign-out. No service-role key is used. No SQL migration is required: no table stores chats, keys or sessions, and no SQL is executed. Supabase Auth supplies identity; **Supabase SQL cannot maintain a WhatsApp connection**. An independently operated persistent Node worker is necessary.

## Limits and risks

- Only bounded text/captions are captured when emitted. Incomplete history, missing chats, ordering, deletion and group behavior are unverified; no sending or media downloads. No claim that this works with current WhatsApp servers.
- Everything is volatile. Worker restart or crash erases keys and chats; the linked device may remain registered. Sign-out clears the browser only; it does not stop or unlink the worker. Unlink removes local state and attempts remote logout but remote removal is **not confirmed**. Verify/remove the device in WhatsApp's Linked devices. Normal JS memory, swap and crash dumps cannot be reliably erased.
- Auth tokens are not intentionally persisted but exist in browser memory; passwords and codes can remain in memory temporarily. Anyone with access to the page, browser, machine, host or a stolen token could impersonate the user. No claims of immediate token revocation. Rates/capacity/isolation are single-process staging controls, not distributed guarantees.
- This is a loopback-only lab, not an Internet-ready service. Exposing the port, reversing through a proxy or using a public tunnel is unsafe. GitHub Pages alone cannot host the Node worker. Do not paste real codes, tokens, passwords or chats into messages, logs or issues.

## Local setup for a developer (no live linking)

Requirements: Node 20.19+ and Corepack/pnpm, a separate empty Supabase staging project with an existing test user and email/password sign-in enabled. Use only that project's trusted HTTPS URL and **public anon key**, never a service-role key. Ensure all supplied project values refer to the same staging project. Keep secrets out of source control, shell history, process logs and screenshots. `.env` is ignored; no environment file is automatically loaded.

1. Reconstruct the committed lockfile parts: `cat lock.gz.b64.part00 lock.gz.b64.part01 lock.gz.b64.part02 lock.gz.b64.part03 | base64 -d | gzip -d > pnpm-lock.yaml`. Its SHA-256 should be `26ef41b6f0f053897b18297b9f994a6747bd236694d2f680ab9502b8c83cdd75`. Run `corepack pnpm install --frozen-lockfile --ignore-scripts`, then `corepack pnpm test`. Tests use mocks and fake data only. The pinned Baileys release candidate and transitive dependencies require review before any live trial.
2. Set `STAGING_SUPABASE_URL`, `STAGING_SUPABASE_ANON_KEY`, and `STAGING_APP_ORIGIN=http://127.0.0.1:8000` privately in the worker environment. Run `corepack pnpm start`; it listens at `127.0.0.1:8787`. No credentials are included in this repository.
3. Separately run `python3 -m http.server 8000 --bind 127.0.0.1` in the project directory. Open `http://127.0.0.1:8000` locally. Enter the same staging project URL and public key and a staging user login; sign-in is memory-only and must be repeated on refresh/token expiry. Test only with mocked software or after explicit separate approval for a disposable account. Never forward the loopback ports. Stop both processes after use.

## Before any real deployment

Independent threat review and adversarial two-user tests; live tests using expressly approved disposable accounts; update/audit Baileys; a dedicated secure always-on host, TLS, authentication/authorization review, global rate limiting, capacity/DoS protection, secrets management, monitored operations and no-sensitive-data logging; robust encrypted per-owner credential persistence and key lifecycle if reconnection after restart is desired; privacy/retention/deletion policy, secure browser CSP and deployment headers, session revocation, crash handling and rollback. Confirm unlink remotely. This lab is not a substitute for any of these steps. Existing Rada storage/privacy work is separate and unaffected.
