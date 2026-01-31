'use client';

import type { Issue } from '@/lib/types';

interface IssuesListProps {
  issues: Issue[];
  limit?: number;
}

function getSeverityStyles(severity: Issue['severity']) {
  switch (severity) {
    case 'critical':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-700',
        icon: '🔴',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-700',
        icon: '🟡',
      };
    case 'info':
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        badge: 'bg-blue-100 text-blue-700',
        icon: '🔵',
      };
    default:
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        badge: 'bg-green-100 text-green-700',
        icon: '🟢',
      };
  }
}

export default function IssuesList({ issues, limit }: IssuesListProps) {
  const displayIssues = limit ? issues.slice(0, limit) : issues;

  if (issues.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <span className="text-4xl">✨</span>
        <p className="mt-2">No issues found!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayIssues.map((issue, index) => {
        const styles = getSeverityStyles(issue.severity);
        return (
          <div
            key={index}
            className={`${styles.bg} ${styles.border} border rounded-lg p-4`}
          >
            <div className="flex items-start gap-3">
              <span className="text-lg">{styles.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`${styles.badge} text-xs px-2 py-0.5 rounded-full font-medium`}>
                    {issue.severity.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">{issue.code}</span>
                </div>
                <p className="font-medium text-gray-900">{issue.message}</p>
                {issue.recommendation && (
                  <p className="text-sm text-gray-600 mt-1">
                    💡 {issue.recommendation}
                  </p>
                )}
                {issue.element && (
                  <p className="text-xs text-gray-500 mt-2 font-mono bg-gray-100 p-2 rounded">
                    {issue.element.substring(0, 100)}
                    {issue.element.length > 100 ? '...' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {limit && issues.length > limit && (
        <p className="text-center text-sm text-gray-500">
          +{issues.length - limit} more issues
        </p>
      )}
    </div>
  );
}
