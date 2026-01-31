// Types
export * from './types/index.js';

// Crawler
export { SiteCrawler, PageParser, RobotsParser, SitemapParser } from './crawler/index.js';

// Analyzers
export {
  BaseAnalyzer,
  MetaAnalyzer,
  HeadingAnalyzer,
  ContentAnalyzer,
  LinkAnalyzer,
  ImageAnalyzer,
  TechnicalAnalyzer,
  MobileAnalyzer,
  SchemaAnalyzer,
  SecurityAnalyzer,
  runAllAnalyzers,
  calculateOverallScore,
} from './analyzers/index.js';

// Detectors
export { PlatformDetector, ShopifyDetector, WordPressDetector } from './detectors/index.js';

// Connectors
export { PageSpeedInsights, GoogleSearchConsole } from './connectors/index.js';

// Reports
export { ReportGenerator } from './reports/index.js';

// Main SEO Auditor class
import { SiteCrawler } from './crawler/index.js';
import { runAllAnalyzers, calculateOverallScore } from './analyzers/index.js';
import { PlatformDetector } from './detectors/index.js';
import { ReportGenerator } from './reports/index.js';
import type { AuditResult, AuditOptions, PageData } from './types/index.js';

export class SEOAuditor {
  private options: AuditOptions;

  constructor(options: AuditOptions = {}) {
    this.options = options;
  }

  async auditUrl(url: string): Promise<AuditResult> {
    const crawler = new SiteCrawler(url, this.options);
    const pageData = await crawler.crawlSinglePage(url);
    return this.analyzePageData(pageData);
  }

  async auditSite(url: string): Promise<AuditResult[]> {
    const crawler = new SiteCrawler(url, this.options);
    const crawlResult = await crawler.crawl();

    const results: AuditResult[] = [];
    for (const pageData of crawlResult.pages) {
      const result = await this.analyzePageData(pageData);
      results.push(result);
    }

    return results;
  }

  private async analyzePageData(pageData: PageData): Promise<AuditResult> {
    const analyzerResults = await runAllAnalyzers(pageData);
    const scores = calculateOverallScore(analyzerResults);

    const platformDetector = new PlatformDetector(pageData);
    const platform = platformDetector.detect();

    const allIssues = analyzerResults.flatMap(r => r.issues);

    const reportGenerator = new ReportGenerator();
    const recommendations = reportGenerator.generateRecommendations(analyzerResults);

    return {
      url: pageData.url,
      timestamp: new Date(),
      platform,
      scores,
      analyzers: analyzerResults,
      issues: allIssues,
      recommendations,
    };
  }

  generateReport(result: AuditResult, format: 'json' | 'html' = 'json'): string {
    const generator = new ReportGenerator();

    if (format === 'html') {
      return generator.generateHTML(result);
    }

    return generator.generateJSON(result);
  }

  generateSummary(result: AuditResult): string {
    const generator = new ReportGenerator();
    return generator.generateSummary(result);
  }
}
