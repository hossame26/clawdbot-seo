import * as cheerio from 'cheerio';
import type { SitemapData, SitemapUrl } from '../types/index.js';

export class SitemapParser {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async parse(sitemapUrls?: string[]): Promise<SitemapData> {
    const urlsToParse = sitemapUrls?.length
      ? sitemapUrls
      : [new URL('/sitemap.xml', this.baseUrl).href];

    const allUrls: SitemapUrl[] = [];

    for (const sitemapUrl of urlsToParse) {
      try {
        const urls = await this.parseSitemap(sitemapUrl);
        allUrls.push(...urls);
      } catch {
        // Continue with other sitemaps
      }
    }

    return {
      exists: allUrls.length > 0,
      urls: allUrls,
    };
  }

  private async parseSitemap(url: string): Promise<SitemapUrl[]> {
    const response = await fetch(url);

    if (!response.ok) {
      return [];
    }

    const content = await response.text();
    const $ = cheerio.load(content, { xmlMode: true });

    // Check if it's a sitemap index
    const sitemapIndexUrls = $('sitemapindex sitemap loc')
      .map((_, el) => $(el).text().trim())
      .get();

    if (sitemapIndexUrls.length > 0) {
      const allUrls: SitemapUrl[] = [];
      for (const indexUrl of sitemapIndexUrls) {
        const urls = await this.parseSitemap(indexUrl);
        allUrls.push(...urls);
      }
      return allUrls;
    }

    // Parse regular sitemap
    const urls: SitemapUrl[] = [];
    $('urlset url').each((_, el) => {
      const $el = $(el);
      const loc = $el.find('loc').text().trim();

      if (loc) {
        const lastmod = $el.find('lastmod').text().trim() || undefined;
        const priority = parseFloat($el.find('priority').text()) || undefined;
        const changefreq = $el.find('changefreq').text().trim() || undefined;

        urls.push({
          url: loc,
          lastmod,
          priority,
          changefreq,
        });
      }
    });

    return urls;
  }

  validateSitemap(sitemapData: SitemapData): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!sitemapData.exists) {
      issues.push('No sitemap found');
      return { isValid: false, issues };
    }

    if (sitemapData.urls.length === 0) {
      issues.push('Sitemap is empty');
    }

    if (sitemapData.urls.length > 50000) {
      issues.push('Sitemap exceeds 50,000 URL limit');
    }

    const seenUrls = new Set<string>();
    for (const urlEntry of sitemapData.urls) {
      if (seenUrls.has(urlEntry.url)) {
        issues.push(`Duplicate URL found: ${urlEntry.url}`);
      }
      seenUrls.add(urlEntry.url);

      if (urlEntry.priority !== undefined && (urlEntry.priority < 0 || urlEntry.priority > 1)) {
        issues.push(`Invalid priority value for ${urlEntry.url}: ${urlEntry.priority}`);
      }

      if (urlEntry.changefreq) {
        const validFrequencies = ['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never'];
        if (!validFrequencies.includes(urlEntry.changefreq)) {
          issues.push(`Invalid changefreq for ${urlEntry.url}: ${urlEntry.changefreq}`);
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}
