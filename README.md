# StreetVM — Anytime VM (Track B)

A minimal compute model: **VALUE / REFINE / COMPOSE**.

Computation is the act of reducing uncertainty — every program is
`estimate → refine → refine → …`, and resources > 0 always yields a
result. The VM knows nothing about CPUs, GPUs, networks, or machine
count; hardware (GPU today, photonics tomorrow) implements the VM's
contract.

See [SPEC.md](SPEC.md) — the source of truth.

**Track B** of a two-track design experiment: here `refine()` lives inside
`Value` per the original SPEC. Track A (`suitzero/vm`) uses separate
Value/Refiner objects. Same task list ([TASKS.md](TASKS.md)), both tracks.

## Layout

- `src/vm/` — the three primitives. Substrate-agnostic core.
- `src/experiments/` — π digits and progressive image rendering on the identical interface.
- `src/runtime/` — *future*: budget, scheduling, distribution (placeholder).
- `src/world/` — *future*: read/commit/tick semantics (placeholder).

## Develop

```sh
npm install
npm test        # vitest, headless
npm run build   # typecheck + build
```

## Status

v0.1 — design stage. Core not yet implemented.
