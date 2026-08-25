# SettleCheck — N:M Settlement Reconciliation Engine

Built for the Razorpay AI Buildathon, Track 4 (AI Finance Controller).

## The problem

Reconciliation between a merchant's internal orders and Razorpay's settlement
records is usually treated as a 1:1 lookup: "does this order equal that
settlement?" In real payments data it isn't 1:1 — a single order can be paid
out across multiple settlements (split settlement), and multiple orders can
be bundled into one settlement (merged batch). SettleCheck handles both.

## How it works

```
orders + settlements
        │
        ▼
 PASS 1 — exact match
   same reference ID, amount within fee tolerance
        │  (leftovers only)
        ▼
 PASS 2 — bounded subset-sum (N:M)
   branch-and-bound search over a small candidate window,
   max group size 4, confidence-scored
        │  (below-threshold or no match)
        ▼
 CONFIDENCE GATE
   nothing auto-resolves below the threshold — ever
        │
        ▼
 EXCEPTIONS  ──▶  LLM narration (explanation only, never a decision)
        │
        ▼
 AUDIT LOG — every match and every exception, with reasoning
```

**Design principle:** matching money must be provably correct, not
plausible. All matching logic (Pass 1 and Pass 2) is deterministic Java —
no LLM involved. The one LLM call in the codebase (`ExplainerService`)
writes a human-readable note for an exception that's already been decided;
it never decides whether records match.

## Stack

- Java 17, Spring Boot 3 (Web, Data JPA)
- PostgreSQL
- Docker + docker-compose
- JUnit 5 (matcher correctness tests — see `MatcherServiceTest`)

## Running it

```bash
docker compose up --build
```

Then, from a separate terminal:

```bash
# seed a synthetic batch (mix of clean/split/merged/broken cases)
curl -X POST "http://localhost:8080/data/generate?clean=30&split=10&merged=8&broken=6"

# run reconciliation
curl -X POST http://localhost:8080/reconcile/run

# see the report
curl http://localhost:8080/reconcile/report

# see exceptions with explanations
curl http://localhost:8080/reconcile/exceptions

# see the full reasoning trail for one record
curl http://localhost:8080/audit/{recordId}
```

## Running tests

```bash
mvn test
```

`MatcherServiceTest` covers: exact match, split-settlement (Pass 2),
a genuinely unmatchable pair (should raise exceptions, not guess), and a
near-tolerance ambiguous case (should refuse to auto-resolve).

## Config

All tunable in `application.yml`:

| Property | Meaning |
|---|---|
| `fee-tolerance-percent` | allowed drift between order amount and settled net |
| `settlement-window-days` | how many days after order creation a settlement may land |
| `min-confidence` | subset-sum matches below this are routed to exceptions |
| `llm.enabled` | flip on once a real LLM provider is wired into `ExplainerService` |

## What's intentionally out of scope

- No auto-resolution of any kind below the confidence threshold
- No live money movement — this only recommends and logs
- No Kubernetes deployment for the demo (manifests can be added; not
  required to prove the reconciliation logic itself)
- No ML model — the matching problem is combinatorial, not statistical,
  so a deterministic search is both faster and provably correct

## Known simplification (documented on purpose)

`raiseExceptionsForLeftovers` currently applies a coarse rule for exception
`reasonCode` classification. A production version would break this into
finer-grained checks (e.g. distinguishing `AMOUNT_MISMATCH` from
`LOW_CONFIDENCE_GROUP` explicitly, rather than inferring from context).
Flagged here deliberately rather than hidden — see the pitch's "failure
recovery" section.
