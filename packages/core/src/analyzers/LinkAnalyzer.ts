import { BaseAnalyzer } from './BaseAnalyzer.js';
import type { AnalyzerResult, LinkData } from '../types/index.js';

export class LinkAnalyzer extends BaseAnalyzer {
  get name(): string {
    return 'Links';
  }

  get maxScore(): number {
    return 100;
  }

  async analyze(): Promise<AnalyzerResult> {
    const links = this.parser.getLinks();
    let penalty = 0;

    penalty += this.analyzeLinkCount(links);
    penalty += this.analyzeInternalLinks(links);
    penalty += this.analyzeExternalLinks(links);
    penalty += this.analyzeAnchorText(links);
    penalty += await this.checkBrokenLinks(links);

    const internalLinks = links.filter(l => l.isInternal);
    const externalLinks = links.filter(l => !l.isInternal);

    return {
      name: this.name,
      score: this.calculateScore(penalty),
      maxScore: this.maxScore,
      issues: this.issues,
      data: {
        totalLinks: links.length,
        internalLinks: internalLinks.length,
        externalLinks: externalLinks.length,
        nofollowLinks: links.filter(l => l.isNofollow).length,
        links,
      },
    };
  }

  private analyzeLinkCount(links: LinkData[]): number {
    let penalty = 0;

    if (links.length === 0) {
      this.addIssue({
        code: 'NO_LINKS',
        message: 'Page has no links',
        severity: 'warning',
        recommendation: 'Add internal and external links to provide value and improve navigation',
      });
      penalty += 15;
    } else if (links.length > 100) {
      this.addIssue({
        code: 'TOO_MANY_LINKS',
        message: `Page has ${links.length} links`,
        severity: 'info',
        recommendation: 'Consider reducing the number of links. Too many links may dilute link equity',
      });
      penalty += 5;
    }

    return penalty;
  }

  private analyzeInternalLinks(links: LinkData[]): number {
    const internalLinks = links.filter(l => l.isInternal);
    let penalty = 0;

    if (internalLinks.length === 0 && links.length > 0) {
      this.addIssue({
        code: 'NO_INTERNAL_LINKS',
        message: 'Page has no internal links',
        severity: 'warning',
        recommendation: 'Add internal links to help users navigate and distribute link equity',
      });
      penalty += 15;
    }

    return penalty;
  }

  private analyzeExternalLinks(links: LinkData[]): number {
    const externalLinks = links.filter(l => !l.isInternal);
    let penalty = 0;

    const unsecureLinks = externalLinks.filter(l => l.href.startsWith('http://'));
    if (unsecureLinks.length > 0) {
      this.addIssue({
        code: 'INSECURE_EXTERNAL_LINKS',
        message: `${unsecureLinks.length} external links use HTTP instead of HTTPS`,
        severity: 'info',
        element: unsecureLinks.slice(0, 3).map(l => l.href).join(', '),
        recommendation: 'Update external links to use HTTPS where available',
      });
      penalty += 5;
    }

    return penalty;
  }

  private analyzeAnchorText(links: LinkData[]): number {
    let penalty = 0;

    const emptyAnchors = links.filter(l => !l.text.trim());
    if (emptyAnchors.length > 0) {
      this.addIssue({
        code: 'EMPTY_ANCHOR_TEXT',
        message: `${emptyAnchors.length} links have no anchor text`,
        severity: 'warning',
        element: emptyAnchors.slice(0, 3).map(l => l.href).join(', '),
        recommendation: 'Add descriptive anchor text to all links',
      });
      penalty += emptyAnchors.length * 2;
    }

    const genericAnchors = ['click here', 'read more', 'learn more', 'here', 'link'];
    const genericLinks = links.filter(l =>
      genericAnchors.includes(l.text.toLowerCase().trim())
    );

    if (genericLinks.length > 0) {
      this.addIssue({
        code: 'GENERIC_ANCHOR_TEXT',
        message: `${genericLinks.length} links use generic anchor text`,
        severity: 'info',
        element: genericLinks.slice(0, 3).map(l => `"${l.text}"`).join(', '),
        recommendation: 'Use descriptive anchor text that indicates the link destination',
      });
      penalty += genericLinks.length;
    }

    return Math.min(penalty, 20);
  }

  private async checkBrokenLinks(links: LinkData[]): Promise<number> {
    let penalty = 0;
    const uniqueLinks = [...new Set(links.map(l => l.href))].slice(0, 20);

    const brokenLinks: string[] = [];

    for (const href of uniqueLinks) {
      if (!href.startsWith('http')) continue;

      try {
        const response = await fetch(href, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });

        if (response.status >= 400) {
          brokenLinks.push(href);
        }
      } catch {
        // Network errors might be temporary, don't penalize heavily
      }
    }

    if (brokenLinks.length > 0) {
      this.addIssue({
        code: 'BROKEN_LINKS',
        message: `${brokenLinks.length} broken links detected`,
        severity: 'critical',
        element: brokenLinks.slice(0, 5).join(', '),
        recommendation: 'Fix or remove broken links to improve user experience and SEO',
      });
      penalty += brokenLinks.length * 5;
    }

    return penalty;
  }
}
