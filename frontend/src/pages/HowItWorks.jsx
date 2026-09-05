const CARDS = [
  {
    title: 'Why not just use an LLM to match everything?',
    body: "Matching money must be provably correct, not merely plausible. Pass 1 and Pass 2 are deterministic Java — same input, same output, every time, and every decision can be re-derived by hand. An LLM's job here is narration only: writing the human-readable reason for an exception that's already been decided.",
  },
  {
    title: 'Why "N:M" instead of 1:1?',
    body: 'Real settlement data isn\u2019t a clean lookup. One order can be paid out across several settlements (a split), and several orders can land in one payout (a merged batch). Pass 2 searches bounded subsets of candidates — capped at a small group size — for a sum that lands within fee tolerance.',
  },
  {
    title: 'What stops a wrong auto-match?',
    body: 'Every Pass 2 match gets a confidence score based on group size and closeness to the tolerance edge. Anything below the threshold is never auto-resolved — it\u2019s routed to the exceptions queue for a human to review instead.',
  },
  {
    title: "What's actually logged?",
    body: 'Every match and every exception writes a row to the audit log: which pass resolved it, the confidence score, and the reasoning. Nothing happens silently — that\u2019s the entire point of an audit trail.',
  },
];

export default function HowItWorks() {
  return (
    <section className="view active">
      <header className="view-head">
        <span className="eyebrow">Design notes</span>
        <h1>How it works, and why</h1>
      </header>

      <div className="explainer-grid">
        {CARDS.map((c, i) => (
          <div className="explainer-card" key={c.title}>
            <span className="explainer-num">{String(i + 1).padStart(2, '0')}</span>
            <h3>{c.title}</h3>
            <p>{c.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
