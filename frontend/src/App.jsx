import { Routes, Route } from 'react-router-dom'
import AppLayout from './layouts/AppLayout.jsx'
import Overview from './pages/Overview.jsx'
import SeedData from './pages/SeedData.jsx'
import Reconcile from './pages/Reconcile.jsx'
import Matches from './pages/Matches.jsx'
import Exceptions from './pages/Exceptions.jsx'
import Audit from './pages/Audit.jsx'
import HowItWorks from './pages/HowItWorks.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Overview />} />
        <Route path="/data" element={<SeedData />} />
        <Route path="/reconcile" element={<Reconcile />} />
        <Route path="/matches" element={<Matches />} />
        <Route path="/exceptions" element={<Exceptions />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
      </Route>
    </Routes>
  );
}
