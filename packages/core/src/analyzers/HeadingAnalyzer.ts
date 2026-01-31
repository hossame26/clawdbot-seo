import { BaseAnalyzer } from './BaseAnalyzer.js';
import type { AnalyzerResult, HeadingData } from '../types/index.js';

export class HeadingAnalyzer extends BaseAnalyzer {
  get name(): string {
    return 'Headings Structure';
  }

  get maxScore(): number {
    return 100;
  }

  async analyze(): Promise<AnalyzerResult> {
    const headings = this.parser.getHeadings();
    let penalty = 0;

    penalty += this.analyzeH1(headings);
    penalty += this.analyzeHierarchy(headings);
    penalty += this.analyzeHeadingContent(headings);

    return {
      name: this.name,
      score: this.calculateScore(penalty),
      maxScore: this.maxScore,
      issues: this.issues,
      data: {
        headings,
        structure: this.buildHeadingStructure(headings),
      },
    };
  }

  private analyzeH1(headings: HeadingData[]): number {
    const h1s = headings.filter(h => h.level === 1);
    let penalty = 0;

    if (h1s.length === 0) {
      this.addIssue({
        code: 'MISSING_H1',
        message: 'Page is missing an H1 heading',
        severity: 'critical',
        recommendation: 'Add a single, descriptive H1 heading that summarizes the page content',
      });
      penalty += 30;
    } else if (h1s.length > 1) {
      this.addIssue({
        code: 'MULTIPLE_H1',
        message: `Page has ${h1s.length} H1 headings`,
        severity: 'warning',
        element: h1s.map(h => h.text).join(', '),
        recommendation: 'Use only one H1 heading per page. Use H2-H6 for subheadings',
      });
      penalty += 15;
    }

    if (h1s.length > 0) {
      const h1 = h1s[0];
      if (h1.text.length < 10) {
        this.addIssue({
          code: 'H1_TOO_SHORT',
          message: 'H1 heading is too short',
          severity: 'info',
          element: h1.text,
          recommendation: 'H1 should be descriptive and include relevant keywords',
        });
        penalty += 5;
      } else if (h1.text.length > 70) {
        this.addIssue({
          code: 'H1_TOO_LONG',
          message: 'H1 heading is too long',
          severity: 'info',
          element: h1.text,
          recommendation: 'Keep H1 concise while still being descriptive',
        });
        penalty += 5;
      }
    }

    return penalty;
  }

  private analyzeHierarchy(headings: HeadingData[]): number {
    let penalty = 0;
    let previousLevel = 0;

    for (const heading of headings) {
      if (previousLevel > 0 && heading.level > previousLevel + 1) {
        this.addIssue({
          code: 'SKIPPED_HEADING_LEVEL',
          message: `Heading hierarchy skips from H${previousLevel} to H${heading.level}`,
          severity: 'warning',
          element: heading.text,
          recommendation: `Don't skip heading levels. Use H${previousLevel + 1} instead of H${heading.level}`,
        });
        penalty += 5;
      }
      previousLevel = heading.level;
    }

    const hasH2 = headings.some(h => h.level === 2);
    if (headings.length > 1 && !hasH2) {
      this.addIssue({
        code: 'MISSING_H2',
        message: 'Page has no H2 headings',
        severity: 'info',
        recommendation: 'Use H2 headings to break up content into logical sections',
      });
      penalty += 5;
    }

    return penalty;
  }

  private analyzeHeadingContent(headings: HeadingData[]): number {
    let penalty = 0;
    const seenHeadings = new Set<string>();

    for (const heading of headings) {
      const normalizedText = heading.text.toLowerCase().trim();

      if (seenHeadings.has(normalizedText)) {
        this.addIssue({
          code: 'DUPLICATE_HEADING',
          message: `Duplicate heading: "${heading.text}"`,
          severity: 'info',
          element: heading.text,
          recommendation: 'Use unique headings to help users and search engines understand content structure',
        });
        penalty += 2;
      }
      seenHeadings.add(normalizedText);

      if (heading.text.length === 0) {
        this.addIssue({
          code: 'EMPTY_HEADING',
          message: `Empty H${heading.level} heading found`,
          severity: 'warning',
          recommendation: 'Remove empty headings or add meaningful content',
        });
        penalty += 5;
      }
    }

    return penalty;
  }

  private buildHeadingStructure(headings: HeadingData[]): Record<string, number> {
    const structure: Record<string, number> = {
      h1: 0,
      h2: 0,
      h3: 0,
      h4: 0,
      h5: 0,
      h6: 0,
    };

    for (const heading of headings) {
      structure[`h${heading.level}`]++;
    }

    return structure;
  }
}
