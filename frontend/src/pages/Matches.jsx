import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'
import { SkeletonRows } from '../components/Skeleton.jsx'

export default function Matches() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getMatches();
      setMatches(data);
    } catch (err) {
      setError('No /matches endpoint yet — add a GET /matches to ReconcileController that returns matchRepo.findAll().');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <section className="view active">
      <header className="view-head">
        <span className="eyebrow">Resolved</span>
        <h1>Matches</h1>
        <p className="lede">Every record the engine resolved with confidence — click a row to see its full audit trail.</p>
      </header>

      <div className="table-toolbar">
        <button className="btn btn-ghost" onClick={load}>↻ Refresh</button>
        <span className="table-count">{matches ? `${matches.length} matches` : ''}</span>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr><th>Pass</th><th>Orders</th><th>Settlements</th><th>Confidence</th></tr>
          </thead>
          <tbody>
            {loading && <SkeletonRows count={5} cols={4} />}
            {!loading && error && <tr><td colSpan="4">{error}</td></tr>}
            {!loading && !error && matches && matches.length === 0 && <tr><td colSpan="4">No matches yet — run reconciliation first.</td></tr>}
            {!loading && !error && matches && matches.map(m => (
              <tr key={m.matchId} onClick={() => navigate(`/audit?id=${encodeURIComponent(m.matchId)}`)} style={{ cursor: 'pointer' }}>
                <td><span className={`tag ${m.passType === 'EXACT' ? 'tag-exact' : 'tag-subset'}`}>{m.passType}</span></td>
                <td>{m.orderIds.join(', ')}</td>
                <td>{m.settlementIds.join(', ')}</td>
                <td>{m.confidence}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
