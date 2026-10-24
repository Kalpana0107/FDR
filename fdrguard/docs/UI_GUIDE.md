You are building the frontend of FDRGuard (AICTE security deposit / FDR portal) in /frontend.
STACK (strict): React + Vite, React Router, Tailwind v4 (theme tokens already in src/index.css), Recharts, lucide-react. No other UI kits.
RULES:
- Use ONLY theme tokens and the .card/.btn classes from index.css. No random hex colours.
- Always render statuses with components/StatusBadge.jsx.
- FDR numbers, hashes and amounts use font-mono.
- All data comes from src/api/client.js (mock-first). Never hardcode data inside components.
- Responsive, clean spacing, subtle hover states, empty/loading/error states on every screen.
- Show a "Simulated" chip next to anything bank, lien, SMS or sign-off related.
First reply with a short plan; then build; then run npm run build and fix errors.


# FDRGuard UI Guide: "Sentinel Navy"

One theme, one set of tokens. Every screen must follow this guide.

## Tokens (defined in `frontend/src/index.css`)
| Token | Value | Use |
|---|---|---|
| `surface` | #F6F8FC | page background |
| `card` | #FFFFFF | cards (rounded-2xl, 1px `line` border) |
| `brand` | #3B5BDB | primary actions, links |
| `ink` | #0B1B3A | text, headings |
| `muted` | #5B6B8C | secondary text |
| hero | navy to indigo gradient | `.hero` class |

Fonts: Plus Jakarta Sans (headings, `font-heading`), Inter (body, `font-sans`), JetBrains Mono (FDR numbers and hashes, `font-mono` or `.mono`).

## Status colours (always via `StatusBadge.jsx`)
| Status | Colour |
|---|---|
| Verified, Active | green (`ok`) |
| Pending, Verification Pending, Maturing | amber (`warn`) |
| Returned | orange (`ret`) |
| Rejected, Failed | red (`bad`) |
| Under Review, Submitted, Release in Progress | blue (`info`) |
| Renewed | indigo (`renew`) |
| Released, Withdrawn | slate (`done`) |

## Classes
`.card`, `.btn`, `.btn-primary`, `.btn-ghost`, `.btn-danger`, `.hero`, `.mono`, `.chip-simulated`.

## Signature elements
Lifecycle stepper, submitted-vs-bank compare, chain-link audit viewer, boarding-pass QR receipt, "Simulated" chip (on every simulated bank / AICTE lien / SMS / sign-off result).

## Rules for AI code generation
1. Use only theme tokens and `.card` / `.btn` classes. No hex codes, no new UI kits.
2. Always render statuses with `StatusBadge.jsx`.
3. No hardcoded data in components. Fetch through `src/api/client.js`.
4. Every screen has loading, empty and error states.
5. Anything simulated carries the "Simulated" chip.
6. Run `npm run build` after every screen.

## Build order (one screen per prompt)
1. App shell: sidebar, top bar, role switcher
2. Login
3. College dashboard, then New FDR with upload and OCR review
4. FDR record page: stepper, documents, history, remarks, Time Machine slider
5. Officer queue, bank-verification compare, duplicates panel
6. Management dashboard: totals, Verified / Pending / Failed, radar, Health Score
7. Release request and two-person approval, then QR receipt
8. Audit chain viewer and public receipt-verify page



