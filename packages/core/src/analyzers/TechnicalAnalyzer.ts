import { BaseAnalyzer } from './BaseAnalyzer.js';
import type { AnalyzerResult, PageData } from '../types/index.js';

export class TechnicalAnalyzer extends BaseAnalyzer {
  get name(): string {
    return 'Technical SEO';
  }

  get maxScore(): number {
    return 100;
  }

  async analyze(): Promise<AnalyzerResult> {
    let penalty = 0;

    penalty += this.analyzeStatusCode();
    penalty += this.analyzeLoadTime();
    penalty += this.analyzeHTTPS();
    penalty += this.analyzeCompression();
    penalty += this.analyzeCaching();
    penalty += this.analyzeResources();

    return {
      name: this.name,
      score: this.calculateScore(penalty),
      maxScore: this.maxScore,
      issues: this.issues,
      data: {
        statusCode: this.pageData.statusCode,
        loadTime: this.pageData.loadTime,
        isHttps: this.pageData.url.startsWith('https'),
        resourceStats: this.calculateResourceStats(),
      },
    };
  }

  private analyzeStatusCode(): number {
    const { statusCode } = this.pageData;

    if (statusCode >= 400) {
      this.addIssue({
        code: 'HTTP_ERROR',
        message: `Page returns HTTP ${statusCode} error`,
        severity: 'critical',
        recommendation: 'Fix the server error to make the page accessible',
      });
      return 30;
    }

    if (statusCode >= 300 && statusCode < 400) {
      this.addIssue({
        code: 'REDIRECT',
        message: `Page returns HTTP ${statusCode} redirect`,
        severity: 'info',
        recommendation: 'Consider updating links to point directly to the final URL',
      });
      return 5;
    }

    return 0;
  }

  private analyzeLoadTime(): number {
    const { loadTime } = this.pageData;
    let penalty = 0;

    if (loadTime > 5000) {
      this.addIssue({
        code: 'SLOW_PAGE',
        message: `Page load time is very slow (${(loadTime / 1000).toFixed(1)}s)`,
        severity: 'critical',
        recommendation: 'Optimize page speed. Aim for under 3 seconds load time',
      });
      penalty += 25;
    } else if (loadTime > 3000) {
      this.addIssue({
        code: 'MODERATE_LOAD_TIME',
        message: `Page load time is moderate (${(loadTime / 1000).toFixed(1)}s)`,
        severity: 'warning',
        recommendation: 'Consider optimizing for faster load times. Aim for under 2 seconds',
      });
      penalty += 10;
    } else if (loadTime > 2000) {
      this.addIssue({
        code: 'COULD_BE_FASTER',
        message: `Page load time is ${(loadTime / 1000).toFixed(1)}s`,
        severity: 'info',
        recommendation: 'Page speed is acceptable but could be improved',
      });
      penalty += 5;
    }

    return penalty;
  }

  private analyzeHTTPS(): number {
    if (!this.pageData.url.startsWith('https')) {
      this.addIssue({
        code: 'NOT_HTTPS',
        message: 'Page is not served over HTTPS',
        severity: 'critical',
        recommendation: 'Enable HTTPS for security and SEO benefits',
      });
      return 20;
    }
    return 0;
  }

  private analyzeCompression(): number {
    const encoding = this.pageData.headers['content-encoding'];

    if (!encoding || (!encoding.includes('gzip') && !encoding.includes('br'))) {
      this.addIssue({
        code: 'NO_COMPRESSION',
        message: 'Page is not using gzip or brotli compression',
        severity: 'warning',
        recommendation: 'Enable gzip or brotli compression to reduce page size',
      });
      return 10;
    }

    return 0;
  }

  private analyzeCaching(): number {
    const cacheControl = this.pageData.headers['cache-control'];

    if (!cacheControl) {
      this.addIssue({
        code: 'NO_CACHE_HEADERS',
        message: 'Page is missing cache-control headers',
        severity: 'info',
        recommendation: 'Add cache-control headers to improve repeat visit performance',
      });
      return 5;
    }

    return 0;
  }

  private analyzeResources(): number {
    const { resources } = this.pageData;
    let penalty = 0;

    const scripts = resources.filter(r => r.type === 'script');
    const stylesheets = resources.filter(r => r.type === 'stylesheet');

    if (scripts.length > 20) {
      this.addIssue({
        code: 'TOO_MANY_SCRIPTS',
        message: `Page loads ${scripts.length} JavaScript files`,
        severity: 'warning',
        recommendation: 'Consider bundling JavaScript files to reduce HTTP requests',
      });
      penalty += 10;
    }

    if (stylesheets.length > 10) {
      this.addIssue({
        code: 'TOO_MANY_STYLESHEETS',
        message: `Page loads ${stylesheets.length} CSS files`,
        severity: 'info',
        recommendation: 'Consider bundling CSS files to reduce HTTP requests',
      });
      penalty += 5;
    }

    const totalResourceSize = resources.reduce((sum, r) => sum + r.size, 0);
    const sizeMB = totalResourceSize / (1024 * 1024);

    if (sizeMB > 5) {
      this.addIssue({
        code: 'HEAVY_PAGE',
        message: `Total page weight is ${sizeMB.toFixed(2)}MB`,
        severity: 'critical',
        recommendation: 'Reduce page weight to under 3MB for better performance',
      });
      penalty += 15;
    } else if (sizeMB > 3) {
      this.addIssue({
        code: 'MODERATELY_HEAVY_PAGE',
        message: `Total page weight is ${sizeMB.toFixed(2)}MB`,
        severity: 'warning',
        recommendation: 'Consider reducing page weight for better performance',
      });
      penalty += 8;
    }

    return penalty;
  }

  private calculateResourceStats(): Record<string, unknown> {
    const { resources } = this.pageData;

    const byType: Record<string, { count: number; size: number }> = {};

    for (const resource of resources) {
      if (!byType[resource.type]) {
        byType[resource.type] = { count: 0, size: 0 };
      }
      byType[resource.type].count++;
      byType[resource.type].size += resource.size;
    }

    return {
      totalResources: resources.length,
      totalSize: resources.reduce((sum, r) => sum + r.size, 0),
      byType,
    };
  }
}
