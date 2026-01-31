import type { AuditResult, Issue } from '../../types/index.js';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getScoreColor(score: number): string {
  if (score >= 90) return '#00c853';
  if (score >= 70) return '#ffc107';
  if (score >= 50) return '#ff9800';
  return '#f44336';
}

function getSeverityBadge(severity: Issue['severity']): string {
  const colors = {
    critical: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
    success: '#00c853',
  };
  return `<span style="background: ${colors[severity]}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${severity.toUpperCase()}</span>`;
}

export function htmlTemplate(result: AuditResult): string {
  const { scores, analyzers, issues, recommendations, platform, url, timestamp } = result;

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEO Audit Report - ${escapeHtml(url)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 { font-size: 2rem; margin-bottom: 10px; }
    .header p { opacity: 0.9; }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 20px;
      margin-bottom: 20px;
    }
    .card h2 {
      font-size: 1.25rem;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #eee;
    }
    .score-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }
    .score-card {
      text-align: center;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .score-circle {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 10px;
      font-size: 2rem;
      font-weight: bold;
      color: white;
    }
    .score-label { font-weight: 600; color: #666; }
    .issues-summary {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }
    .issue-count {
      padding: 10px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 600;
    }
    .issue-count.critical { background: #f44336; }
    .issue-count.warning { background: #ff9800; }
    .issue-count.info { background: #2196f3; }
    .issue-item {
      padding: 15px;
      border-left: 4px solid;
      margin-bottom: 10px;
      background: #fafafa;
      border-radius: 0 4px 4px 0;
    }
    .issue-item.critical { border-color: #f44336; }
    .issue-item.warning { border-color: #ff9800; }
    .issue-item.info { border-color: #2196f3; }
    .issue-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 5px;
    }
    .issue-message { font-weight: 600; }
    .issue-recommendation {
      font-size: 0.9rem;
      color: #666;
      margin-top: 5px;
    }
    .analyzer-scores {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 15px;
    }
    .analyzer-item {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 15px;
      background: #fafafa;
      border-radius: 8px;
    }
    .analyzer-score {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: bold;
      flex-shrink: 0;
    }
    .analyzer-name { font-weight: 600; }
    .analyzer-issues { font-size: 0.85rem; color: #666; }
    .recommendation-item {
      padding: 15px;
      background: #fafafa;
      border-radius: 8px;
      margin-bottom: 10px;
    }
    .recommendation-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 5px;
    }
    .priority-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      color: white;
    }
    .priority-badge.high { background: #f44336; }
    .priority-badge.medium { background: #ff9800; }
    .priority-badge.low { background: #2196f3; }
    .platform-info {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
    }
    .platform-item {
      padding: 10px 15px;
      background: #e3f2fd;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>SEO Audit Report</h1>
    <p>${escapeHtml(url)}</p>
    <p style="opacity: 0.7; font-size: 0.9rem;">Generated: ${new Date(timestamp).toLocaleString()}</p>
  </div>

  <div class="container">
    <div class="score-grid">
      <div class="score-card">
        <div class="score-circle" style="background: ${getScoreColor(scores.overall)}">
          ${scores.overall}
        </div>
        <div class="score-label">Overall Score</div>
      </div>
      <div class="score-card">
        <div class="score-circle" style="background: ${getScoreColor(scores.technical)}">
          ${scores.technical}
        </div>
        <div class="score-label">Technical</div>
      </div>
      <div class="score-card">
        <div class="score-circle" style="background: ${getScoreColor(scores.content)}">
          ${scores.content}
        </div>
        <div class="score-label">Content</div>
      </div>
      <div class="score-card">
        <div class="score-circle" style="background: ${getScoreColor(scores.performance)}">
          ${scores.performance}
        </div>
        <div class="score-label">Performance</div>
      </div>
      <div class="score-card">
        <div class="score-circle" style="background: ${getScoreColor(scores.mobile)}">
          ${scores.mobile}
        </div>
        <div class="score-label">Mobile</div>
      </div>
    </div>

    ${platform.name !== 'unknown' ? `
    <div class="card">
      <h2>Platform Detected</h2>
      <div class="platform-info">
        <div class="platform-item"><strong>Platform:</strong> ${escapeHtml(platform.name)}</div>
        ${platform.version ? `<div class="platform-item"><strong>Version:</strong> ${escapeHtml(platform.version)}</div>` : ''}
        ${platform.theme ? `<div class="platform-item"><strong>Theme:</strong> ${escapeHtml(platform.theme)}</div>` : ''}
        ${platform.seoPlugin ? `<div class="platform-item"><strong>SEO Plugin:</strong> ${escapeHtml(platform.seoPlugin)}</div>` : ''}
      </div>
    </div>
    ` : ''}

    <div class="card">
      <h2>Issues Summary</h2>
      <div class="issues-summary">
        <div class="issue-count critical">${criticalCount} Critical</div>
        <div class="issue-count warning">${warningCount} Warnings</div>
        <div class="issue-count info">${infoCount} Info</div>
      </div>
    </div>

    <div class="card">
      <h2>Analyzer Results</h2>
      <div class="analyzer-scores">
        ${analyzers.map(a => `
          <div class="analyzer-item">
            <div class="analyzer-score" style="background: ${getScoreColor(a.score)}">${a.score}</div>
            <div>
              <div class="analyzer-name">${escapeHtml(a.name)}</div>
              <div class="analyzer-issues">${a.issues.length} issue${a.issues.length !== 1 ? 's' : ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card">
      <h2>Critical Issues</h2>
      ${issues.filter(i => i.severity === 'critical').map(issue => `
        <div class="issue-item critical">
          <div class="issue-header">
            ${getSeverityBadge(issue.severity)}
            <span class="issue-message">${escapeHtml(issue.message)}</span>
          </div>
          ${issue.recommendation ? `<div class="issue-recommendation">${escapeHtml(issue.recommendation)}</div>` : ''}
        </div>
      `).join('') || '<p style="color: #666;">No critical issues found!</p>'}
    </div>

    <div class="card">
      <h2>Warnings</h2>
      ${issues.filter(i => i.severity === 'warning').map(issue => `
        <div class="issue-item warning">
          <div class="issue-header">
            ${getSeverityBadge(issue.severity)}
            <span class="issue-message">${escapeHtml(issue.message)}</span>
          </div>
          ${issue.recommendation ? `<div class="issue-recommendation">${escapeHtml(issue.recommendation)}</div>` : ''}
        </div>
      `).join('') || '<p style="color: #666;">No warnings found!</p>'}
    </div>

    <div class="card">
      <h2>Top Recommendations</h2>
      ${recommendations.slice(0, 10).map(rec => `
        <div class="recommendation-item">
          <div class="recommendation-header">
            <span class="priority-badge ${rec.priority}">${rec.priority.toUpperCase()}</span>
            <strong>${escapeHtml(rec.title)}</strong>
            <span style="color: #666; font-size: 0.85rem;">${escapeHtml(rec.category)}</span>
          </div>
          <p style="color: #666; margin-top: 5px;">${escapeHtml(rec.description)}</p>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="footer">
    <p>Generated by ClawdBot SEO Auditor</p>
  </div>
</body>
</html>`;
}
