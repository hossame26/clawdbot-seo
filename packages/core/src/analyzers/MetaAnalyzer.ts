import { BaseAnalyzer } from './BaseAnalyzer.js';
import type { AnalyzerResult, MetaData } from '../types/index.js';

export class MetaAnalyzer extends BaseAnalyzer {
  get name(): string {
    return 'Meta Tags';
  }

  get maxScore(): number {
    return 100;
  }

  async analyze(): Promise<AnalyzerResult> {
    const meta = this.parser.getMetaData();
    let penalty = 0;

    penalty += this.analyzeTitle(meta);
    penalty += this.analyzeDescription(meta);
    penalty += this.analyzeCanonical(meta);
    penalty += this.analyzeOpenGraph(meta);
    penalty += this.analyzeTwitterCards(meta);
    penalty += this.analyzeViewport(meta);
    penalty += this.analyzeCharset(meta);

    return {
      name: this.name,
      score: this.calculateScore(penalty),
      maxScore: this.maxScore,
      issues: this.issues,
      data: { meta },
    };
  }

  private analyzeTitle(meta: MetaData): number {
    let penalty = 0;

    if (!meta.title) {
      this.addIssue({
        code: 'MISSING_TITLE',
        message: 'Page is missing a title tag',
        severity: 'critical',
        recommendation: 'Add a unique, descriptive title tag between 30-60 characters',
      });
      penalty += 25;
    } else {
      const titleLength = meta.title.length;

      if (titleLength < 30) {
        this.addIssue({
          code: 'TITLE_TOO_SHORT',
          message: `Title is too short (${titleLength} characters)`,
          severity: 'warning',
          element: meta.title,
          recommendation: 'Title should be between 30-60 characters for optimal display in search results',
        });
        penalty += 10;
      } else if (titleLength > 60) {
        this.addIssue({
          code: 'TITLE_TOO_LONG',
          message: `Title is too long (${titleLength} characters)`,
          severity: 'warning',
          element: meta.title,
          recommendation: 'Title may be truncated in search results. Keep it under 60 characters',
        });
        penalty += 5;
      }
    }

    return penalty;
  }

  private analyzeDescription(meta: MetaData): number {
    let penalty = 0;

    if (!meta.description) {
      this.addIssue({
        code: 'MISSING_DESCRIPTION',
        message: 'Page is missing a meta description',
        severity: 'critical',
        recommendation: 'Add a compelling meta description between 120-160 characters',
      });
      penalty += 20;
    } else {
      const descLength = meta.description.length;

      if (descLength < 120) {
        this.addIssue({
          code: 'DESCRIPTION_TOO_SHORT',
          message: `Meta description is too short (${descLength} characters)`,
          severity: 'warning',
          element: meta.description,
          recommendation: 'Meta description should be between 120-160 characters',
        });
        penalty += 8;
      } else if (descLength > 160) {
        this.addIssue({
          code: 'DESCRIPTION_TOO_LONG',
          message: `Meta description is too long (${descLength} characters)`,
          severity: 'info',
          element: meta.description,
          recommendation: 'Meta description may be truncated. Consider keeping it under 160 characters',
        });
        penalty += 3;
      }
    }

    return penalty;
  }

  private analyzeCanonical(meta: MetaData): number {
    if (!meta.canonical) {
      this.addIssue({
        code: 'MISSING_CANONICAL',
        message: 'Page is missing a canonical URL',
        severity: 'warning',
        recommendation: 'Add a canonical tag to prevent duplicate content issues',
      });
      return 10;
    }
    return 0;
  }

  private analyzeOpenGraph(meta: MetaData): number {
    let penalty = 0;

    if (!meta.ogTitle) {
      this.addIssue({
        code: 'MISSING_OG_TITLE',
        message: 'Missing Open Graph title (og:title)',
        severity: 'info',
        recommendation: 'Add og:title for better social media sharing',
      });
      penalty += 3;
    }

    if (!meta.ogDescription) {
      this.addIssue({
        code: 'MISSING_OG_DESCRIPTION',
        message: 'Missing Open Graph description (og:description)',
        severity: 'info',
        recommendation: 'Add og:description for better social media sharing',
      });
      penalty += 3;
    }

    if (!meta.ogImage) {
      this.addIssue({
        code: 'MISSING_OG_IMAGE',
        message: 'Missing Open Graph image (og:image)',
        severity: 'info',
        recommendation: 'Add og:image for visual appeal when shared on social media',
      });
      penalty += 3;
    }

    return penalty;
  }

  private analyzeTwitterCards(meta: MetaData): number {
    let penalty = 0;

    if (!meta.twitterCard) {
      this.addIssue({
        code: 'MISSING_TWITTER_CARD',
        message: 'Missing Twitter Card meta tag',
        severity: 'info',
        recommendation: 'Add twitter:card for better Twitter sharing',
      });
      penalty += 2;
    }

    return penalty;
  }

  private analyzeViewport(meta: MetaData): number {
    if (!meta.viewport) {
      this.addIssue({
        code: 'MISSING_VIEWPORT',
        message: 'Page is missing viewport meta tag',
        severity: 'critical',
        recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile responsiveness',
      });
      return 15;
    }
    return 0;
  }

  private analyzeCharset(meta: MetaData): number {
    if (!meta.charset) {
      this.addIssue({
        code: 'MISSING_CHARSET',
        message: 'Page is missing charset declaration',
        severity: 'warning',
        recommendation: 'Add <meta charset="UTF-8"> for proper character encoding',
      });
      return 5;
    }
    return 0;
  }
}
