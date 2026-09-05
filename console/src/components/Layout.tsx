import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useOutlet } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Activity, AlertCircle } from 'lucide-react';
import { Toaster } from 'react-hot-toast';

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const outlet = useOutlet();
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    setLastUpdated(new Date());
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid triggering when user is typing in inputs (though we don't have many here)
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case '1':
          navigate('/');
          break;
        case '2':
          navigate('/exceptions');
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const viewName = location.pathname === '/exceptions' ? 'Exceptions' : 'Dashboard';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col text-slate-800 font-sans">
      <Toaster position="bottom-right" />

      {/* Persistent Top Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xl">
            <Activity size={24} />
            <span>SettleCheck</span>
          </div>
          <div className="h-6 w-px bg-gray-300"></div>
          <h1 className="text-lg font-medium text-gray-700">{viewName}</h1>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </div>
      </header>

      {/* Navigation (Optional visual representation of shortcuts) */}
      <nav className="bg-gray-50 border-b border-gray-200 px-6 py-2 flex space-x-6 text-sm">
        <button
          onClick={() => navigate('/')}
          className={`flex items-center space-x-2 pb-1 ${location.pathname === '/' ? 'text-indigo-600 border-b-2 border-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <Activity size={16} />
          <span>Dashboard</span>
          <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-xs ml-2">1</span>
        </button>
        <button
          onClick={() => navigate('/exceptions')}
          className={`flex items-center space-x-2 pb-1 ${location.pathname === '/exceptions' ? 'text-indigo-600 border-b-2 border-indigo-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}
        >
          <AlertCircle size={16} />
          <span>Exceptions</span>
          <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded text-xs ml-2">2</span>
        </button>
      </nav>

      {/* Main Content Area with Animated Page Transitions */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Layout;
