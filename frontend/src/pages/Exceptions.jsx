import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { SkeletonCards } from '../components/Skeleton.jsx'

export default function Exceptions() {
  const navigate = useNavigate();
  const [exceptions, setExceptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getExceptions();
      setExceptions(data);
    } catch (err) {
      setError('Could not reach the API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <section className="view active">
      <header className="view-head">
        <span className="eyebrow">Needs review</span>
        <h1>Exceptions</h1>
        <p className="lede">Nothing here was resolved automatically. Each row carries a reason code and a plain-English note — never a guessed match.</p>
      </header>

      <div className="table-toolbar">
        <button className="btn btn-ghost" onClick={load}>↻ Refresh</button>
        <span className="table-count">{exceptions ? `${exceptions.length} open` : ''}</span>
      </div>

      <div className="exceptions-list">
        {loading && <SkeletonCards count={4} />}
        {!loading && error && <p className="empty-state">{error}</p>}
        {!loading && !error && exceptions && exceptions.length === 0 && (
          <p className="empty-state">No exceptions — run reconciliation first.</p>
        )}
        {!loading && !error && exceptions && exceptions.map(ex => (
          <div
            className="exception-card"
            key={ex.exceptionId}
            onClick={() => navigate(`/audit?id=${encodeURIComponent(ex.exceptionId)}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className="exception-head">
              <span className="exception-reason">{ex.reasonCode}</span>
              <span className="exception-ids">{[...(ex.orderIds || []), ...(ex.settlementIds || [])].join(', ')}</span>
            </div>
            <p className="exception-note">{ex.llmExplanation || 'No explanation generated yet.'}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
