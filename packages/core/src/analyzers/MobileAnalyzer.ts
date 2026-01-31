import { BaseAnalyzer } from './BaseAnalyzer.js';
import type { AnalyzerResult } from '../types/index.js';

export class MobileAnalyzer extends BaseAnalyzer {
  get name(): string {
    return 'Mobile Friendliness';
  }

  get maxScore(): number {
    return 100;
  }

  async analyze(): Promise<AnalyzerResult> {
    let penalty = 0;

    penalty += this.analyzeViewport();
    penalty += this.analyzeTextSize();
    penalty += this.analyzeTapTargets();
    penalty += this.analyzeResponsiveImages();
    penalty += this.analyzeHorizontalScrolling();

    return {
      name: this.name,
      score: this.calculateScore(penalty),
      maxScore: this.maxScore,
      issues: this.issues,
      data: {
        hasViewport: this.parser.hasViewport(),
        viewport: this.parser.getMetaData().viewport,
      },
    };
  }

  private analyzeViewport(): number {
    const meta = this.parser.getMetaData();

    if (!meta.viewport) {
      this.addIssue({
        code: 'MISSING_VIEWPORT',
        message: 'Page is missing viewport meta tag',
        severity: 'critical',
        recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">',
      });
      return 30;
    }

    const viewport = meta.viewport.toLowerCase();

    if (!viewport.includes('width=device-width')) {
      this.addIssue({
        code: 'VIEWPORT_NO_DEVICE_WIDTH',
        message: 'Viewport is not set to device width',
        severity: 'warning',
        recommendation: 'Set viewport width to device-width for proper mobile scaling',
      });
      return 15;
    }

    if (viewport.includes('maximum-scale=1') || viewport.includes('user-scalable=no')) {
      this.addIssue({
        code: 'VIEWPORT_ZOOM_DISABLED',
        message: 'Viewport prevents user from zooming',
        severity: 'warning',
        recommendation: 'Allow users to zoom for accessibility. Remove maximum-scale and user-scalable restrictions',
      });
      return 10;
    }

    return 0;
  }

  private analyzeTextSize(): number {
    // This would require rendering analysis in a real implementation
    // For now, we check for common issues in CSS
    const html = this.pageData.html.toLowerCase();

    if (html.includes('font-size: 10px') || html.includes('font-size:10px')) {
      this.addIssue({
        code: 'SMALL_FONT_SIZE',
        message: 'Page may contain text that is too small on mobile',
        severity: 'info',
        recommendation: 'Use a minimum font size of 16px for body text on mobile',
      });
      return 5;
    }

    return 0;
  }

  private analyzeTapTargets(): number {
    const links = this.parser.getLinks();
    let penalty = 0;

    // Check for links that are too close together (simplified check)
    const emptyLinks = links.filter(l => l.text.length < 2);

    if (emptyLinks.length > 5) {
      this.addIssue({
        code: 'SMALL_TAP_TARGETS',
        message: `${emptyLinks.length} links may have insufficient tap target size`,
        severity: 'info',
        recommendation: 'Ensure tap targets are at least 48x48 CSS pixels with sufficient spacing',
      });
      penalty += 10;
    }

    return penalty;
  }

  private analyzeResponsiveImages(): number {
    const images = this.parser.getImages();
    let penalty = 0;

    const hasSrcset = this.pageData.html.includes('srcset');
    const hasPicture = this.pageData.html.includes('<picture');

    if (images.length > 3 && !hasSrcset && !hasPicture) {
      this.addIssue({
        code: 'NO_RESPONSIVE_IMAGES',
        message: 'Page does not use responsive images (srcset or picture)',
        severity: 'info',
        recommendation: 'Use srcset or picture elements to serve appropriately sized images on different devices',
      });
      penalty += 10;
    }

    return penalty;
  }

  private analyzeHorizontalScrolling(): number {
    // This would require actual rendering analysis
    // Check for common CSS issues that cause horizontal scroll
    const html = this.pageData.html;

    const hasFixedWidths = /width:\s*\d{4,}px/.test(html);

    if (hasFixedWidths) {
      this.addIssue({
        code: 'POTENTIAL_HORIZONTAL_SCROLL',
        message: 'Page may have elements with fixed widths that cause horizontal scrolling',
        severity: 'info',
        recommendation: 'Use relative widths (%, vw) instead of fixed pixel widths for large elements',
      });
      return 10;
    }

    return 0;
  }
}
