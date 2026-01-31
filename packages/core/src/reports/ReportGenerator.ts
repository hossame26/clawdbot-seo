import type { AuditResult, Issue, Recommendation, AnalyzerResult } from '../types/index.js';
import { htmlTemplate } from './templates/html.js';

export class ReportGenerator {
  generateJSON(result: AuditResult): string {
    return JSON.stringify(result, null, 2);
  }

  generateHTML(result: AuditResult): string {
    return htmlTemplate(result);
  }

  generateRecommendations(results: AnalyzerResult[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const allIssues = results.flatMap(r => r.issues);

    // Group critical issues
    const criticalIssues = allIssues.filter(i => i.severity === 'critical');
    const warningIssues = allIssues.filter(i => i.severity === 'warning');
    const infoIssues = allIssues.filter(i => i.severity === 'info');

    // Generate recommendations from critical issues
    for (const issue of criticalIssues) {
      if (issue.recommendation) {
        recommendations.push({
          title: this.getRecommendationTitle(issue),
          description: issue.recommendation,
          priority: 'high',
          category: this.getCategoryFromCode(issue.code),
          estimatedImpact: 'High impact on SEO and user experience',
        });
      }
    }

    // Generate recommendations from warnings
    for (const issue of warningIssues) {
      if (issue.recommendation) {
        recommendations.push({
          title: this.getRecommendationTitle(issue),
          description: issue.recommendation,
          priority: 'medium',
          category: this.getCategoryFromCode(issue.code),
          estimatedImpact: 'Moderate impact on SEO',
        });
      }
    }

    // Generate recommendations from info issues (limit to top 10)
    for (const issue of infoIssues.slice(0, 10)) {
      if (issue.recommendation) {
        recommendations.push({
          title: this.getRecommendationTitle(issue),
          description: issue.recommendation,
          priority: 'low',
          category: this.getCategoryFromCode(issue.code),
          estimatedImpact: 'Minor improvement opportunity',
        });
      }
    }

    // Remove duplicates and sort by priority
    const seen = new Set<string>();
    return recommendations
      .filter(r => {
        const key = `${r.title}-${r.description}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }

  private getRecommendationTitle(issue: Issue): string {
    const titleMap: Record<string, string> = {
      MISSING_TITLE: 'Add Page Title',
      MISSING_DESCRIPTION: 'Add Meta Description',
      MISSING_H1: 'Add H1 Heading',
      MULTIPLE_H1: 'Fix Multiple H1 Headings',
      MISSING_VIEWPORT: 'Add Viewport Meta Tag',
      NOT_HTTPS: 'Enable HTTPS',
      SLOW_PAGE: 'Improve Page Speed',
      THIN_CONTENT: 'Add More Content',
      MISSING_ALT_TAGS: 'Add Image Alt Text',
      BROKEN_LINKS: 'Fix Broken Links',
      NO_STRUCTURED_DATA: 'Add Structured Data',
      MISSING_CANONICAL: 'Add Canonical URL',
    };

    return titleMap[issue.code] || issue.message.split(' ').slice(0, 4).join(' ');
  }

  private getCategoryFromCode(code: string): string {
    const categoryMap: Record<string, string> = {
      MISSING_TITLE: 'Meta Tags',
      TITLE_TOO_SHORT: 'Meta Tags',
      TITLE_TOO_LONG: 'Meta Tags',
      MISSING_DESCRIPTION: 'Meta Tags',
      DESCRIPTION_TOO_SHORT: 'Meta Tags',
      DESCRIPTION_TOO_LONG: 'Meta Tags',
      MISSING_CANONICAL: 'Meta Tags',
      MISSING_OG_TITLE: 'Social Media',
      MISSING_OG_DESCRIPTION: 'Social Media',
      MISSING_OG_IMAGE: 'Social Media',
      MISSING_TWITTER_CARD: 'Social Media',
      MISSING_H1: 'Content Structure',
      MULTIPLE_H1: 'Content Structure',
      SKIPPED_HEADING_LEVEL: 'Content Structure',
      THIN_CONTENT: 'Content',
      KEYWORD_STUFFING: 'Content',
      MISSING_LANG: 'Accessibility',
      NO_LINKS: 'Links',
      BROKEN_LINKS: 'Links',
      EMPTY_ANCHOR_TEXT: 'Links',
      MISSING_ALT_TAGS: 'Images',
      NO_MODERN_IMAGE_FORMATS: 'Performance',
      MISSING_IMAGE_DIMENSIONS: 'Performance',
      NOT_HTTPS: 'Security',
      MISSING_HSTS: 'Security',
      MIXED_CONTENT: 'Security',
      SLOW_PAGE: 'Performance',
      NO_COMPRESSION: 'Performance',
      TOO_MANY_SCRIPTS: 'Performance',
      MISSING_VIEWPORT: 'Mobile',
      NO_RESPONSIVE_IMAGES: 'Mobile',
      NO_STRUCTURED_DATA: 'Structured Data',
      INVALID_SCHEMA: 'Structured Data',
    };

    return categoryMap[code] || 'General';
  }

  generateSummary(result: AuditResult): string {
    const { scores, issues } = result;
    const critical = issues.filter(i => i.severity === 'critical').length;
    const warnings = issues.filter(i => i.severity === 'warning').length;

    let summary = `SEO Audit Summary for ${result.url}\n`;
    summary += `${'='.repeat(50)}\n\n`;

    summary += `Overall Score: ${scores.overall}/100\n`;
    summary += `├── Technical: ${scores.technical}/100\n`;
    summary += `├── Content: ${scores.content}/100\n`;
    summary += `├── Performance: ${scores.performance}/100\n`;
    summary += `└── Mobile: ${scores.mobile}/100\n\n`;

    summary += `Issues Found:\n`;
    summary += `├── Critical: ${critical}\n`;
    summary += `├── Warnings: ${warnings}\n`;
    summary += `└── Info: ${issues.filter(i => i.severity === 'info').length}\n\n`;

    if (result.platform.name !== 'custom') {
      summary += `Platform Detected: ${result.platform.name}`;
      if (result.platform.version) {
        summary += ` v${result.platform.version}`;
      }
      if (result.platform.theme) {
        summary += ` (${result.platform.theme})`;
      }
      summary += '\n\n';
    }

    return summary;
  }
}
