import React, { useEffect, useState } from 'react';
import { getExceptions, type ExceptionRecord } from '../api';
import { AlertCircle, FileText, CheckCircle } from 'lucide-react';

const ExceptionSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg p-5 mb-4 border border-gray-100 shadow-sm animate-pulse flex space-x-4">
    <div className="w-10 h-10 rounded-full bg-gray-200 shrink-0"></div>
    <div className="flex-1 space-y-3 py-1">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="w-24 h-6 bg-gray-200 rounded shrink-0"></div>
  </div>
);

const Exceptions: React.FC = () => {
  const [exceptions, setExceptions] = useState<ExceptionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchExceptions = async () => {
      try {
        const data = await getExceptions();
        setExceptions(data);
      } catch (error) {
        console.error('Failed to fetch exceptions', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExceptions();
  }, []);

  const getReasonColor = (reason: string) => {
    if (reason.includes('MISSING')) return 'text-amber-600 bg-amber-50';
    if (reason.includes('MISMATCH')) return 'text-red-600 bg-red-50';
    return 'text-blue-600 bg-blue-50';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
        {[1, 2, 3, 4].map((i) => <ExceptionSkeleton key={i} />)}
      </div>
    );
  }

  if (exceptions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20">
        <CheckCircle size={64} className="text-emerald-400 mb-4" />
        <h3 className="text-xl font-medium text-gray-800">All Clear</h3>
        <p className="text-gray-500 mt-2">No exceptions found in the latest reconciliation run.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Review Exceptions</h2>
          <p className="text-gray-500 mt-1">Records that require manual intervention or review.</p>
        </div>
        <div className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
          {exceptions.length} Items
        </div>
      </div>

      <div className="space-y-4">
        {exceptions.map((ex) => (
          <div key={ex.exceptionId} className="bg-white rounded-lg p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">

              <div className="flex items-start space-x-4">
                <div className={`mt-1 p-2 rounded-full ${getReasonColor(ex.reasonCode)}`}>
                  <AlertCircle size={20} />
                </div>

                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <h4 className="font-semibold text-gray-800">{ex.reasonCode}</h4>
                    <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                      ID: {ex.exceptionId.substring(0, 8)}...
                    </span>
                  </div>

                  {ex.llmExplanation && (
                    <div className="mt-3 mb-4 flex items-start space-x-2 bg-slate-50 p-3 rounded text-sm text-slate-700 border border-slate-100">
                      <FileText size={16} className="text-slate-400 mt-0.5 shrink-0" />
                      <p className="leading-relaxed">{ex.llmExplanation}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-8 text-sm mt-4">
                    <div>
                      <span className="text-gray-500 block mb-1">Order IDs</span>
                      {ex.orderIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {ex.orderIds.map(id => (
                            <span key={id} className="font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs">
                              {id}
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-gray-400 italic">None</span>}
                    </div>

                    <div>
                      <span className="text-gray-500 block mb-1">Settlement IDs</span>
                      {ex.settlementIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {ex.settlementIds.map(id => (
                            <span key={id} className="font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs border border-blue-100">
                              {id}
                            </span>
                          ))}
                        </div>
                      ) : <span className="text-gray-400 italic">None</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  ex.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                }`}>
                  {ex.status}
                </span>
                <div className="text-xs text-gray-400 mt-2 text-right">
                  {new Date(ex.createdAt).toLocaleString()}
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Exceptions;
