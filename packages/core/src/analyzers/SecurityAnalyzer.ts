import { BaseAnalyzer } from './BaseAnalyzer.js';
import type { AnalyzerResult, SecurityData } from '../types/index.js';

export class SecurityAnalyzer extends BaseAnalyzer {
  get name(): string {
    return 'Security';
  }

  get maxScore(): number {
    return 100;
  }

  async analyze(): Promise<AnalyzerResult> {
    const securityData = this.extractSecurityData();
    let penalty = 0;

    penalty += this.analyzeHTTPS(securityData);
    penalty += this.analyzeSecurityHeaders(securityData);
    penalty += this.analyzeMixedContent(securityData);

    return {
      name: this.name,
      score: this.calculateScore(penalty),
      maxScore: this.maxScore,
      issues: this.issues,
      data: { security: securityData },
    };
  }

  private extractSecurityData(): SecurityData {
    const { headers, url, html } = this.pageData;

    // Check for mixed content
    const mixedContent: string[] = [];
    const httpRegex = /http:\/\/[^"'\s]+/g;
    const matches = html.match(httpRegex) || [];

    for (const match of matches) {
      if (!match.includes('http://localhost') && !match.includes('http://127.0.0.1')) {
        mixedContent.push(match);
      }
    }

    return {
      isHttps: url.startsWith('https'),
      hasHSTS: !!headers['strict-transport-security'],
      hasCSP: !!headers['content-security-policy'],
      hasXFrameOptions: !!headers['x-frame-options'],
      hasXContentTypeOptions: !!headers['x-content-type-options'],
      hasReferrerPolicy: !!headers['referrer-policy'],
      mixedContent: [...new Set(mixedContent)].slice(0, 20),
    };
  }

  private analyzeHTTPS(data: SecurityData): number {
    if (!data.isHttps) {
      this.addIssue({
        code: 'NOT_HTTPS',
        message: 'Site is not using HTTPS',
        severity: 'critical',
        recommendation: 'Enable HTTPS to secure user data and improve SEO rankings',
      });
      return 30;
    }
    return 0;
  }

  private analyzeSecurityHeaders(data: SecurityData): number {
    let penalty = 0;

    if (!data.hasHSTS) {
      this.addIssue({
        code: 'MISSING_HSTS',
        message: 'Missing Strict-Transport-Security header',
        severity: 'info',
        recommendation: 'Add HSTS header to enforce HTTPS connections',
      });
      penalty += 5;
    }

    if (!data.hasCSP) {
      this.addIssue({
        code: 'MISSING_CSP',
        message: 'Missing Content-Security-Policy header',
        severity: 'info',
        recommendation: 'Add CSP header to prevent XSS and other injection attacks',
      });
      penalty += 5;
    }

    if (!data.hasXFrameOptions) {
      this.addIssue({
        code: 'MISSING_X_FRAME_OPTIONS',
        message: 'Missing X-Frame-Options header',
        severity: 'info',
        recommendation: 'Add X-Frame-Options header to prevent clickjacking',
      });
      penalty += 5;
    }

    if (!data.hasXContentTypeOptions) {
      this.addIssue({
        code: 'MISSING_X_CONTENT_TYPE_OPTIONS',
        message: 'Missing X-Content-Type-Options header',
        severity: 'info',
        recommendation: 'Add X-Content-Type-Options: nosniff to prevent MIME type sniffing',
      });
      penalty += 5;
    }

    if (!data.hasReferrerPolicy) {
      this.addIssue({
        code: 'MISSING_REFERRER_POLICY',
        message: 'Missing Referrer-Policy header',
        severity: 'info',
        recommendation: 'Add Referrer-Policy header to control referrer information',
      });
      penalty += 3;
    }

    return penalty;
  }

  private analyzeMixedContent(data: SecurityData): number {
    if (data.isHttps && data.mixedContent.length > 0) {
      this.addIssue({
        code: 'MIXED_CONTENT',
        message: `${data.mixedContent.length} resources loaded over insecure HTTP`,
        severity: 'warning',
        element: data.mixedContent.slice(0, 5).join(', '),
        recommendation: 'Update all resource URLs to use HTTPS to avoid mixed content warnings',
      });
      return Math.min(data.mixedContent.length * 2, 20);
    }
    return 0;
  }
}
