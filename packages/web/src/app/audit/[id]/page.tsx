import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAudit } from '@/lib/db';
import ScoreCircle from '@/components/ScoreCircle';
import IssuesList from '@/components/IssuesList';

export const dynamic = 'force-dynamic';

export default function AuditPage({ params }: { params: { id: string } }) {
  const id = parseInt(params.id, 10);

  if (isNaN(id)) {
    notFound();
  }

  const audit = getAudit(id);

  if (!audit) {
    notFound();
  }

  const { result } = audit;
  const { scores, issues, analyzers, platform, recommendations } = result;

  const criticalIssues = issues.filter((i) => i.severity === 'critical');
  const warningIssues = issues.filter((i) => i.severity === 'warning');
  const infoIssues = issues.filter((i) => i.severity === 'info');

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <Link href="/" className="text-primary-600 hover:underline text-sm mb-2 inline-block">
          ← Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">{result.url}</h1>
        <p className="text-gray-500 text-sm">
          Audited on {new Date(result.timestamp).toLocaleString()}
        </p>
      </div>

      {/* Scores */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-6">SEO Scores</h2>
        <div className="flex flex-wrap justify-around gap-8">
          <ScoreCircle score={scores.overall} label="Overall" size="lg" />
          <ScoreCircle score={scores.technical} label="Technical" />
          <ScoreCircle score={scores.content} label="Content" />
          <ScoreCircle score={scores.performance} label="Performance" />
          <ScoreCircle score={scores.mobile} label="Mobile" />
        </div>
      </div>

      {/* Platform Info */}
      {platform.name !== 'custom' && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">Platform Detected</h2>
          <div className="flex flex-wrap gap-4">
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-blue-700 font-medium">{platform.name}</span>
            </div>
            {platform.version && (
              <div className="bg-gray-100 px-4 py-2 rounded-lg">
                <span className="text-gray-700">v{platform.version}</span>
              </div>
            )}
            {platform.theme && (
              <div className="bg-purple-50 px-4 py-2 rounded-lg">
                <span className="text-purple-700">{platform.theme}</span>
              </div>
            )}
            {platform.seoPlugin && (
              <div className="bg-green-50 px-4 py-2 rounded-lg">
                <span className="text-green-700">{platform.seoPlugin}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Issues Summary */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Issues Summary</h2>
        <div className="flex gap-4 mb-6">
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium">
            {criticalIssues.length} Critical
          </div>
          <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg font-medium">
            {warningIssues.length} Warnings
          </div>
          <div className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-medium">
            {infoIssues.length} Info
          </div>
        </div>
      </div>

      {/* Analyzer Results */}
      <div className="card mb-8">
        <h2 className="text-lg font-semibold mb-4">Detailed Analysis</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analyzers.map((analyzer) => (
            <div
              key={analyzer.name}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
            >
              <ScoreCircle score={analyzer.score} label="" size="sm" />
              <div>
                <p className="font-medium text-gray-900">{analyzer.name}</p>
                <p className="text-sm text-gray-500">{analyzer.issues.length} issues</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Critical Issues */}
      {criticalIssues.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4 text-red-700">🔴 Critical Issues</h2>
          <IssuesList issues={criticalIssues} />
        </div>
      )}

      {/* Warnings */}
      {warningIssues.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4 text-yellow-700">🟡 Warnings</h2>
          <IssuesList issues={warningIssues} limit={10} />
        </div>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4">💡 Top Recommendations</h2>
          <div className="space-y-4">
            {recommendations.slice(0, 5).map((rec, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      rec.priority === 'high'
                        ? 'bg-red-100 text-red-700'
                        : rec.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {rec.priority.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">{rec.category}</span>
                </div>
                <p className="font-medium text-gray-900">{rec.title}</p>
                <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Issues */}
      {infoIssues.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-lg font-semibold mb-4 text-blue-700">🔵 Info</h2>
          <IssuesList issues={infoIssues} limit={10} />
        </div>
      )}
    </div>
  );
}
