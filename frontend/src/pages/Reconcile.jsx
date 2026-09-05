import { useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../api.js'
import { useToast } from '../components/Toast.jsx'
import AnimatedNumber from '../components/AnimatedNumber.jsx'
import MatchBreakdownChart from '../components/MatchBreakdownChart.jsx'

export default function Reconcile() {
  const { setReport: setSharedReport } = useOutletContext();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const { push } = useToast();

  const run = async () => {
    setLoading(true);
    try {
      const data = await api.runReconcile();
      setReport(data);
      setSharedReport(data);
      push(`Reconciliation complete — ${data.matchRatePercent}% matched`, 'success');
    } catch (err) {
      push('Could not reach the API — is the backend running on :8080?', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="view active">
      <header className="view-head">
        <span className="eyebrow">Step two</span>
        <h1>Run reconciliation</h1>
        <p className="lede">
          Runs Pass 1, then Pass 2, then gates everything below the confidence threshold into the
          exceptions queue and asks the explainer to narrate each one.
        </p>
      </header>

      <motion.button
        className="btn btn-primary btn-large"
        onClick={run}
        disabled={loading}
        whileTap={{ scale: 0.97 }}
      >
        {loading ? 'Running…' : 'Run reconciliation'}
      </motion.button>

      {report && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="report-grid">
            <div className="report-card report-card-hero">
              <span className="stat-label">Match rate</span>
              <span className="stat-value stat-value-hero"><AnimatedNumber value={report.matchRatePercent} suffix="%" /></span>
            </div>
            <div className="report-card">
              <span className="stat-label">Total processed</span>
              <span className="stat-value"><AnimatedNumber value={report.totalRecordsProcessed} /></span>
            </div>
            <div className="report-card">
              <span className="stat-label">Exact (Pass 1)</span>
              <span className="stat-value"><AnimatedNumber value={report.exactMatches} /></span>
            </div>
            <div className="report-card">
              <span className="stat-label">Subset-sum (Pass 2)</span>
              <span className="stat-value"><AnimatedNumber value={report.subsetSumMatches} /></span>
            </div>
            <div className="report-card report-card-warn">
              <span className="stat-label">Exceptions raised</span>
              <span className="stat-value"><AnimatedNumber value={report.exceptionsRaised} /></span>
            </div>
          </div>

          <div className="chart-card">
            <h3>Breakdown</h3>
            <MatchBreakdownChart
              exact={report.exactMatches}
              subset={report.subsetSumMatches}
              exceptions={report.exceptionsRaised}
            />
          </div>
        </motion.div>
      )}
    </section>
  );
}
