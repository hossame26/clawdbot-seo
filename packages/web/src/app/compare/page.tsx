'use client';

import { useState, useEffect } from 'react';
import ScoreCircle from '@/components/ScoreCircle';

interface AuditSummary {
  id: number;
  url: string;
  overall_score: number;
  technical_score: number;
  content_score: number;
  performance_score: number;
  mobile_score: number;
  issues_count: number;
  critical_count: number;
  created_at: string;
}

export default function ComparePage() {
  const [audits, setAudits] = useState<AuditSummary[]>([]);
  const [selectedAudits, setSelectedAudits] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAudits();
  }, []);

  const fetchAudits = async () => {
    try {
      // In a real app, we'd have a dedicated API for listing audits
      // For now, we'll use a placeholder
      setAudits([]);
    } catch (err) {
      console.error('Failed to fetch audits:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAudit = (id: number) => {
    setSelectedAudits((prev) =>
      prev.includes(id)
        ? prev.filter((a) => a !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev
    );
  };

  const selectedAuditData = audits.filter((a) => selectedAudits.includes(a.id));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Compare Audits</h1>
        <p className="text-gray-600 mt-1">
          Compare SEO scores across different audits
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : audits.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-5xl">⚖️</span>
          <h3 className="text-lg font-medium text-gray-900 mt-4">No audits to compare</h3>
          <p className="text-gray-500 mt-2">
            Run some audits first, then come back to compare results
          </p>
        </div>
      ) : (
        <>
          {/* Selection */}
          <div className="card mb-8">
            <h2 className="text-lg font-semibold mb-4">
              Select Audits to Compare (up to 3)
            </h2>
            <div className="space-y-2">
              {audits.map((audit) => (
                <div
                  key={audit.id}
                  onClick={() => toggleAudit(audit.id)}
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedAudits.includes(audit.id)
                      ? 'bg-primary-50 border-2 border-primary-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{audit.url}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(audit.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ScoreCircle score={audit.overall_score} label="" size="sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Comparison */}
          {selectedAuditData.length >= 2 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">Comparison</h2>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="py-3 px-4 font-medium text-gray-500">Metric</th>
                      {selectedAuditData.map((audit) => (
                        <th key={audit.id} className="py-3 px-4 font-medium text-gray-900">
                          {audit.url}
                          <div className="text-xs text-gray-400 font-normal">
                            {new Date(audit.created_at).toLocaleDateString()}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'overall_score', label: 'Overall Score' },
                      { key: 'technical_score', label: 'Technical' },
                      { key: 'content_score', label: 'Content' },
                      { key: 'performance_score', label: 'Performance' },
                      { key: 'mobile_score', label: 'Mobile' },
                      { key: 'issues_count', label: 'Total Issues' },
                      { key: 'critical_count', label: 'Critical Issues' },
                    ].map((metric) => (
                      <tr key={metric.key} className="border-t">
                        <td className="py-3 px-4 font-medium text-gray-700">
                          {metric.label}
                        </td>
                        {selectedAuditData.map((audit) => {
                          const value = audit[metric.key as keyof AuditSummary] as number;
                          const isScore = metric.key.includes('score');
                          return (
                            <td key={audit.id} className="py-3 px-4">
                              {isScore ? (
                                <span
                                  className={`font-bold ${
                                    value >= 90
                                      ? 'text-green-600'
                                      : value >= 70
                                      ? 'text-yellow-600'
                                      : value >= 50
                                      ? 'text-orange-600'
                                      : 'text-red-600'
                                  }`}
                                >
                                  {value}
                                </span>
                              ) : (
                                <span className="text-gray-900">{value}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
