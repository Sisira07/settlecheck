import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../api.js'

export default function Audit() {
  const [searchParams, setSearchParams] = useSearchParams();
  const idFromUrl = searchParams.get('id') || '';
  const [query, setQuery] = useState(idFromUrl);
  const [entries, setEntries] = useState(null);
  const [error, setError] = useState(null);

  const lookup = async (id) => {
    if (!id) return;
    setError(null);
    setEntries(null);
    try {
      const data = await api.getAuditTrail(id);
      setEntries(data);
    } catch (err) {
      setError('Could not reach the API.');
    }
  };

  // re-runs whenever the URL's ?id= changes (including via a click from Matches/Exceptions)
  useEffect(() => {
    setQuery(idFromUrl);
    if (idFromUrl) lookup(idFromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idFromUrl]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSearchParams(query.trim() ? { id: query.trim() } : {});
  };

  return (
    <section className="view active">
      <header className="view-head">
        <span className="eyebrow">Explainability</span>
        <h1>Audit trail lookup</h1>
        <p className="lede">Paste any order ID, settlement ID, match ID, or exception ID to see every decision the engine logged against it.</p>
      </header>

      <form className="audit-search" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="e.g. ORD-14 or a match/exception ID"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">Look up</button>
      </form>

      <div className="timeline">
        {error && <p className="empty-state">{error}</p>}
        {entries && entries.length === 0 && (
          <p className="empty-state">No audit entries found for "{query}".</p>
        )}
        {entries && entries.map(e => (
          <div className="timeline-item" key={e.logId}>
            <div className="timeline-time">{new Date(e.timestamp).toLocaleString()}</div>
            <div className="timeline-action">
              {e.action}{e.confidence != null ? ` · ${e.confidence}% confidence` : ''}
            </div>
            <div className="timeline-reasoning">{e.reasoning}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
