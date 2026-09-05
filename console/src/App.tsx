
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Exceptions from './pages/Exceptions';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="exceptions" element={<Exceptions />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
