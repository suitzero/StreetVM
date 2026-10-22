# Anytime VM — Task List (Track B: refine() inside Value) — v0.2

**Design verdict (2026-10-22): Track B is canonical.** The two-track experiment
is over: this repo (suitzero/StreetVM) is the main line. Track A
(suitzero/vm, Value/Refiner split) is frozen as a reference implementation —
no new work lands there. Here, `refine()` lives inside Value per the
original SPEC.

Read SPEC.md first. Rules for every task:
- One task = one PR. CI (typecheck + test + build) must be green.
- `src/vm/` stays substrate-agnostic: no DOM, no Node-only APIs.
- Do NOT add code to `src/world/`, GFL, or anything optics-related
  (Task 8's world slice lives in `src/world/` only as specified there).
- Do NOT add a fourth primitive. If you think one is needed, write the
  counterexample in the PR description and stop.
- Smallest runnable proof wins. No speculative abstractions.

Design invariants:
- ISA stays exactly 3 primitives: VALUE / REFINE / COMPOSE.
- Core invariant: quality(refine(V)) >= quality(V) — computation is
  uncertainty reduction.
- Hard layer split: the VM layer knows nothing of world/GPU/network/machine
  count; the runtime owns budget/scheduling; the world owns read/commit/tick.

---

## v0.1 — COMPLETE (Tasks 1–5 + final exam, merged 2026-10-03/04, CI green)

- Task 1 — Green CI + honest README. ✅
- Task 2 — Value with refine() inside + trace + property test. ✅
- Task 3 — Certified π (Interval bounds, real computation). ✅
- Task 4 — COMPOSE on two numeric values (add/mul, gain/cost choices). ✅
- Task 5 — Minimal budget runner `run(value, budget)` in `src/runtime/`. ✅
- Final exam — Monte Carlo π as a Value (same interface). ✅

---

## Task 6 — Progressive image rendering as a Value (generality test #2)

The SAME `Value` interface that carried π now carries an image — no
interface changes.

- `ImageValue implements Value<ImageBuffer>`: `current()` returns the
  current partial render; `quality()` = negative reconstruction error
  against a reference render (higher = better, per the v0.1 convention);
  `refine()` spends one step (more samples per pixel, or finer tiles) and
  returns `{ value, cost }` with quality non-decreasing.
- Deterministic: the sampling seed is carried inside the value (same
  pattern as MonteCarloPi). No injected PRNG at the use site.
- The scene is analytic (e.g. signed-distance shapes rendered by sampling),
  small (e.g. 32×32 or 64×64), computed headlessly in `src/vm/` or
  `src/experiments/` — no DOM, no canvas, no image files.
- Driver mirroring pi-driver: budget ladder (e.g. 1 / 4 / 16 / 64) printed
  as a table of budget → quality, driven through `run(value, budget)`
  unchanged.

Done when: tests green in CI show quality strictly improves across the
budget ladder; `run(value, budget)` drives the image value with no changes
to the runtime.

## Task 7 — Generic COMPOSE (pay off the v0.1 debt)

`CompositeValue` is Interval-only today. Make compose generic WITHOUT
growing the interface and WITHOUT reintroducing a separate Refiner object.

- `compose<T>(op, x: Value<T>, y: Value<T>)` — the composite is itself a
  `Value<T>`; choices still name the child explicitly and carry the
  estimated gain/cost per child.
- The flat use site that won the verdict stays flat: no {value, refiner}
  bundles, no multi-arg constructors at call sites.

Done when: the existing Interval compose tests pass unchanged at the use
site, AND one non-Interval compose test (e.g. composed ImageValues or
Monte Carlo values) is green in CI.

## Task 8 — World = Value (first slice)

A tiny world state exposed as a Value, with the layer split respected.

- In `src/world/`: `WorldValue implements Value<WorldSnapshot>` —
  `current()` = canonical state snapshot; `quality()` = a
  consistency/coverage measure (higher = better); `refine()` = one
  simulation step at finer fidelity (e.g. smaller dt, or more agents
  updated per step).
- The world layer owns read/commit/tick. The VM layer (`src/vm/`) sees only
  the Value interface and must not import from `src/world/`.
- Deliberately tiny: a 1D or small-grid world (e.g. particles on a line,
  cellular grid). No rendering, no physics engine, no networking.

Done when: tests green in CI show a budget ladder over world snapshots
with monotone quality, driven by `run(value, budget)`; and no import from
`src/world/` exists inside `src/vm/`.

---

## Agent prompt template (for the sprint loop)

> You are implementing the Anytime VM on repo suitzero/StreetVM (Track B:
> refine() inside Value, per SPEC.md). Read SPEC.md and TASKS.md first.
> This track keeps `refine()` as a method on `Value<T>` returning
> `{ value, cost }` — do NOT introduce a separate Refiner object.
>
> Task — <task title and description from TASKS.md>
> Acceptance criteria (ALL must hold): <done conditions from TASKS.md>
> Also add/extend headless tests for the logic you touched.
> End state: push your branch and open a PR against main. CI must be green.
> One task = one PR. Do not invent features beyond the task.
