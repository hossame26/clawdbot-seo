import { BaseAnalyzer } from './BaseAnalyzer.js';
import type { AnalyzerResult, ImageData } from '../types/index.js';

export class ImageAnalyzer extends BaseAnalyzer {
  get name(): string {
    return 'Images';
  }

  get maxScore(): number {
    return 100;
  }

  async analyze(): Promise<AnalyzerResult> {
    const images = this.parser.getImages();
    let penalty = 0;

    if (images.length === 0) {
      return {
        name: this.name,
        score: 100,
        maxScore: this.maxScore,
        issues: [{
          code: 'NO_IMAGES',
          message: 'Page has no images',
          severity: 'info',
          recommendation: 'Consider adding relevant images to enhance content',
        }],
        data: { images: [], stats: {} },
      };
    }

    penalty += this.analyzeAltTags(images);
    penalty += this.analyzeImageFormats(images);
    penalty += this.analyzeDimensions(images);
    penalty += this.analyzeLazyLoading(images);

    return {
      name: this.name,
      score: this.calculateScore(penalty),
      maxScore: this.maxScore,
      issues: this.issues,
      data: {
        images,
        stats: this.calculateStats(images),
      },
    };
  }

  private analyzeAltTags(images: ImageData[]): number {
    let penalty = 0;

    const missingAlt = images.filter(img => !img.alt || img.alt.trim() === '');
    if (missingAlt.length > 0) {
      const percentage = Math.round((missingAlt.length / images.length) * 100);
      this.addIssue({
        code: 'MISSING_ALT_TAGS',
        message: `${missingAlt.length} images (${percentage}%) are missing alt text`,
        severity: percentage > 50 ? 'critical' : 'warning',
        element: missingAlt.slice(0, 3).map(img => img.src.split('/').pop()).join(', '),
        recommendation: 'Add descriptive alt text to all images for accessibility and SEO',
      });
      penalty += Math.min(missingAlt.length * 3, 30);
    }

    const emptyAlt = images.filter(img => img.alt === '');
    const longAlt = images.filter(img => img.alt && img.alt.length > 125);

    if (longAlt.length > 0) {
      this.addIssue({
        code: 'ALT_TOO_LONG',
        message: `${longAlt.length} images have alt text over 125 characters`,
        severity: 'info',
        recommendation: 'Keep alt text concise and descriptive (under 125 characters)',
      });
      penalty += longAlt.length;
    }

    return penalty;
  }

  private analyzeImageFormats(images: ImageData[]): number {
    let penalty = 0;

    const formatCounts: Record<string, number> = {};
    const unoptimizedFormats: string[] = [];

    for (const img of images) {
      const url = img.src.toLowerCase();
      let format = 'unknown';

      if (url.includes('.jpg') || url.includes('.jpeg')) format = 'jpeg';
      else if (url.includes('.png')) format = 'png';
      else if (url.includes('.gif')) format = 'gif';
      else if (url.includes('.webp')) format = 'webp';
      else if (url.includes('.avif')) format = 'avif';
      else if (url.includes('.svg')) format = 'svg';

      formatCounts[format] = (formatCounts[format] || 0) + 1;

      if (format === 'png' || format === 'gif') {
        unoptimizedFormats.push(img.src);
      }
    }

    if (!formatCounts['webp'] && !formatCounts['avif']) {
      this.addIssue({
        code: 'NO_MODERN_IMAGE_FORMATS',
        message: 'No modern image formats (WebP, AVIF) detected',
        severity: 'info',
        recommendation: 'Consider using WebP or AVIF formats for better compression and performance',
      });
      penalty += 10;
    }

    if (unoptimizedFormats.length > 3) {
      this.addIssue({
        code: 'UNOPTIMIZED_IMAGE_FORMATS',
        message: `${unoptimizedFormats.length} images use PNG/GIF format`,
        severity: 'info',
        recommendation: 'Consider converting PNG/GIF to WebP for photos and complex images',
      });
      penalty += 5;
    }

    return penalty;
  }

  private analyzeDimensions(images: ImageData[]): number {
    let penalty = 0;

    const missingDimensions = images.filter(img => !img.width || !img.height);
    if (missingDimensions.length > 0) {
      this.addIssue({
        code: 'MISSING_IMAGE_DIMENSIONS',
        message: `${missingDimensions.length} images are missing width/height attributes`,
        severity: 'warning',
        element: missingDimensions.slice(0, 3).map(img => img.src.split('/').pop()).join(', '),
        recommendation: 'Add width and height attributes to prevent layout shifts (CLS)',
      });
      penalty += Math.min(missingDimensions.length * 2, 15);
    }

    return penalty;
  }

  private analyzeLazyLoading(images: ImageData[]): number {
    const belowFoldImages = images.slice(3);
    if (belowFoldImages.length === 0) return 0;

    const notLazyLoaded = belowFoldImages.filter(img => !img.isLazyLoaded);

    if (notLazyLoaded.length > 0) {
      this.addIssue({
        code: 'NO_LAZY_LOADING',
        message: `${notLazyLoaded.length} below-the-fold images are not lazy loaded`,
        severity: 'info',
        recommendation: 'Add loading="lazy" to images below the fold for better performance',
      });
      return 5;
    }

    return 0;
  }

  private calculateStats(images: ImageData[]): Record<string, unknown> {
    const withAlt = images.filter(img => img.alt && img.alt.trim() !== '').length;
    const withDimensions = images.filter(img => img.width && img.height).length;
    const lazyLoaded = images.filter(img => img.isLazyLoaded).length;

    return {
      total: images.length,
      withAlt,
      withoutAlt: images.length - withAlt,
      withDimensions,
      withoutDimensions: images.length - withDimensions,
      lazyLoaded,
      altPercentage: Math.round((withAlt / images.length) * 100),
    };
  }
}
