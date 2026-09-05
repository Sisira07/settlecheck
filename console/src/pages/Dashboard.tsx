import React, { useEffect, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Database, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import { getReport, runReconciliation, generateData, type ReportResponse } from '../api';

const CountUp: React.FC<{ value: number, isPercent?: boolean }> = ({ value, isPercent = false }) => {
  const spring = useSpring(0, { bounce: 0, duration: 1000 });
  const display = useTransform(spring, (current) =>
    isPercent ? `${current.toFixed(1)}%` : Math.floor(current).toString()
  );

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return <motion.span>{display}</motion.span>;
};

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse border border-gray-100">
    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
    <div className="h-8 bg-gray-200 rounded w-3/4"></div>
  </div>
);

const Dashboard: React.FC = () => {
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const fetchReport = async () => {
    try {
      const data = await getReport();
      setReport(data);
    } catch (error) {
      toast.error('Failed to fetch report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleSeed = async () => {
    setActionLoading(true);
    const toastId = toast.loading('Seeding batch...');
    try {
      await generateData();
      toast.success('Batch seeded successfully', { id: toastId });
      // Don't auto-fetch report, let user run it.
    } catch (error) {
      toast.error('Failed to seed batch', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRun = async () => {
    setActionLoading(true);
    const toastId = toast.loading('Running reconciliation...');
    try {
      const data = await runReconciliation();
      setReport(data);
      toast.success('Reconciliation completed', { id: toastId });
    } catch (error) {
      toast.error('Failed to run reconciliation', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="flex space-x-4">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="h-[400px] bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse mt-8 p-6 flex flex-col items-center justify-center">
          <div className="w-48 h-48 rounded-full bg-gray-200"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mt-8"></div>
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'Exact Matches', value: report?.exactMatches || 0, color: '#10b981' }, // Emerald
    { name: 'Subset Matches (N:M)', value: report?.subsetSumMatches || 0, color: '#3b82f6' }, // Blue
    { name: 'Exceptions', value: report?.exceptionsRaised || 0, color: '#ef4444' }, // Red
  ];

  const isEmpty = (report?.totalRecordsProcessed || 0) === 0;

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Reconciliation Overview</h2>
          <p className="text-gray-500 mt-1">Real-time matching statistics and breakdown.</p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleSeed}
            disabled={actionLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Database size={18} />
            <span>Seed Data</span>
          </button>

          <button
            onClick={handleRun}
            disabled={actionLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
          >
            <Play size={18} />
            <span>Run Reconcile</span>
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
          <Database size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-medium text-gray-700">No Data Available</h3>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Generate synthetic batch data and run the reconciliation engine to see the match breakdown.
          </p>
        </div>
      ) : (
        <>
          {/* Animated Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 border-l-4 border-indigo-500 shadow-sm">
              <p className="text-sm font-medium text-gray-500 mb-1">Total Processed</p>
              <div className="text-3xl font-bold text-gray-800">
                <CountUp value={report?.totalRecordsProcessed || 0} />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border-l-4 border-emerald-500 shadow-sm">
              <p className="text-sm font-medium text-gray-500 mb-1">Exact Matches (1:1)</p>
              <div className="text-3xl font-bold text-emerald-600">
                <CountUp value={report?.exactMatches || 0} />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border-l-4 border-blue-500 shadow-sm">
              <p className="text-sm font-medium text-gray-500 mb-1">Subset Matches (N:M)</p>
              <div className="text-3xl font-bold text-blue-600">
                <CountUp value={report?.subsetSumMatches || 0} />
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border-l-4 border-red-500 shadow-sm">
              <p className="text-sm font-medium text-gray-500 mb-1">Exceptions Raised</p>
              <div className="text-3xl font-bold text-red-600">
                <CountUp value={report?.exceptionsRaised || 0} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Chart Area */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Match Rate Breakdown</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={120}
                      paddingAngle={2}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1500}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [`${value} records`, 'Count']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Overall Rate Card */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Overall Match Rate</h3>
              <p className="text-sm text-gray-500 mb-6 text-center">Percentage of records matched automatically without human intervention.</p>

              <div className="relative w-48 h-48 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#f3f4f6"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: (report?.matchRatePercent || 0) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    strokeDasharray="283"
                    style={{
                      strokeDashoffset: useTransform(
                        useSpring((report?.matchRatePercent || 0) / 100, { duration: 1500 }),
                        (v) => 283 - (v * 283)
                      ) as any // Cast because of complex framer-motion type resolution
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-4xl font-bold text-gray-800">
                    <CountUp value={report?.matchRatePercent || 0} isPercent={true} />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
