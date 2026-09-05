import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../api.js'
import Rail from '../components/Rail.jsx'

const SECTIONS = [
  { path: '/', label: 'Overview', title: 'Overview' },
  { path: '/data', label: 'Seed Data', title: 'Seed a synthetic batch' },
  { path: '/reconcile', label: 'Reconcile', title: 'Run reconciliation' },
  { path: '/matches', label: 'Matches', title: 'Resolved matches' },
  { path: '/exceptions', label: 'Exceptions', title: 'Open exceptions' },
  { path: '/audit', label: 'Audit Trail', title: 'Audit trail lookup' },
  { path: '/how-it-works', label: 'How It Works', title: 'Design notes' },
];

export default function AppLayout() {
  const [connected, setConnected] = useState(null);
  const [report, setReport] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    api.checkHealth()
      .then((data) => {
        setConnected(true);
        if (data.totalRecordsProcessed > 0) { setReport(data); setLastUpdated(new Date()); }
      })
      .catch(() => setConnected(false));
  }, []);

  // Keyboard shortcuts: press 1-7 to jump sections (ignored while typing in a field)
  useEffect(() => {
    const handler = (e) => {
      const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      if (typing) return;
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < SECTIONS.length) navigate(SECTIONS[idx].path);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  const current = SECTIONS.find(s =>
    s.path === '/' ? location.pathname === '/' : location.pathname.startsWith(s.path)
  ) || SECTIONS[0];

  const setReportAndStamp = (data) => { setReport(data); setLastUpdated(new Date()); };

  return (
    <div className="app">
      <Rail sections={SECTIONS} connected={connected} />
      <div className="pane-wrap">
        <header className="pane-header">
          <div>
            <span className="pane-header-eyebrow">SettleCheck</span>
            <h2 className="pane-header-title">{current.title}</h2>
          </div>
          {lastUpdated && (
            <span className="pane-header-timestamp">
              Last run {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </header>
        <main className="pane">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Outlet context={{ report, setReport: setReportAndStamp }} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
