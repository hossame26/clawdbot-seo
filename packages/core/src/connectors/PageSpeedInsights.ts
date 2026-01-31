import type {
  ConnectorConfig,
  PageSpeedResult,
  PerformanceData,
  Opportunity,
  Diagnostic,
} from '../types/index.js';

export class PageSpeedInsights {
  private apiKey?: string;
  private baseUrl = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

  constructor(config?: ConnectorConfig) {
    this.apiKey = config?.apiKey;
  }

  async analyze(url: string, strategy: 'mobile' | 'desktop' = 'mobile'): Promise<PageSpeedResult> {
    const params = new URLSearchParams({
      url,
      strategy,
      category: 'performance',
    });

    if (this.apiKey) {
      params.set('key', this.apiKey);
    }

    const response = await fetch(`${this.baseUrl}?${params}`);

    if (!response.ok) {
      throw new Error(`PageSpeed Insights API error: ${response.status}`);
    }

    const data = await response.json() as Record<string, unknown>;
    return this.parseResult(data);
  }

  private parseResult(data: Record<string, unknown>): PageSpeedResult {
    const lighthouse = data.lighthouseResult as Record<string, unknown>;
    const categories = lighthouse.categories as Record<string, { score: number }>;
    const audits = lighthouse.audits as Record<string, Record<string, unknown>>;

    const score = Math.round((categories.performance?.score || 0) * 100);

    const metrics = this.extractMetrics(audits);
    const opportunities = this.extractOpportunities(audits);
    const diagnostics = this.extractDiagnostics(audits);

    return {
      score,
      metrics,
      opportunities,
      diagnostics,
    };
  }

  private extractMetrics(audits: Record<string, Record<string, unknown>>): PerformanceData {
    const getNumericValue = (id: string): number | undefined => {
      const audit = audits[id];
      if (audit && typeof audit.numericValue === 'number') {
        return Math.round(audit.numericValue);
      }
      return undefined;
    };

    return {
      firstContentfulPaint: getNumericValue('first-contentful-paint'),
      largestContentfulPaint: getNumericValue('largest-contentful-paint'),
      cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue as number | undefined,
      timeToInteractive: getNumericValue('interactive'),
      totalBlockingTime: getNumericValue('total-blocking-time'),
      speedIndex: getNumericValue('speed-index'),
    };
  }

  private extractOpportunities(audits: Record<string, Record<string, unknown>>): Opportunity[] {
    const opportunities: Opportunity[] = [];

    const opportunityIds = [
      'render-blocking-resources',
      'unused-css-rules',
      'unused-javascript',
      'modern-image-formats',
      'offscreen-images',
      'unminified-css',
      'unminified-javascript',
      'efficient-animated-content',
      'duplicated-javascript',
      'legacy-javascript',
      'uses-optimized-images',
      'uses-responsive-images',
      'uses-text-compression',
    ];

    for (const id of opportunityIds) {
      const audit = audits[id];
      if (!audit) continue;

      const score = typeof audit.score === 'number' ? audit.score : 1;
      if (score < 1) {
        opportunities.push({
          id,
          title: audit.title as string || id,
          description: audit.description as string || '',
          score,
          numericValue: audit.numericValue as number | undefined,
          displayValue: audit.displayValue as string | undefined,
        });
      }
    }

    return opportunities.sort((a, b) => a.score - b.score);
  }

  private extractDiagnostics(audits: Record<string, Record<string, unknown>>): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];

    const diagnosticIds = [
      'dom-size',
      'critical-request-chains',
      'network-requests',
      'network-rtt',
      'network-server-latency',
      'main-thread-tasks',
      'bootup-time',
      'mainthread-work-breakdown',
      'font-display',
      'third-party-summary',
    ];

    for (const id of diagnosticIds) {
      const audit = audits[id];
      if (!audit) continue;

      const score = typeof audit.score === 'number' ? audit.score : 1;
      if (score < 1 || audit.details) {
        diagnostics.push({
          id,
          title: audit.title as string || id,
          description: audit.description as string || '',
          details: audit.details as Record<string, unknown> | undefined,
        });
      }
    }

    return diagnostics;
  }
}
