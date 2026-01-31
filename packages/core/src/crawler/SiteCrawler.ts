import puppeteer, { Browser, Page } from 'puppeteer';
import { PageParser } from './PageParser.js';
import { RobotsParser } from './RobotsParser.js';
import { SitemapParser } from './SitemapParser.js';
import type {
  CrawlerOptions,
  CrawlResult,
  PageData,
  ResourceData,
} from '../types/index.js';

const DEFAULT_OPTIONS: CrawlerOptions = {
  maxPages: 100,
  maxDepth: 3,
  timeout: 30000,
  userAgent: 'ClawdBot SEO Crawler/1.0',
  respectRobotsTxt: true,
  includeSitemap: true,
  followExternalLinks: false,
  viewport: { width: 1920, height: 1080 },
};

export class SiteCrawler {
  private options: CrawlerOptions;
  private browser: Browser | null = null;
  private visitedUrls: Set<string> = new Set();
  private urlQueue: Array<{ url: string; depth: number }> = [];
  private robotsParser: RobotsParser;
  private sitemapParser: SitemapParser;
  private baseUrl: string;

  constructor(url: string, options: CrawlerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.baseUrl = new URL(url).origin;
    this.robotsParser = new RobotsParser(this.baseUrl);
    this.sitemapParser = new SitemapParser(this.baseUrl);
  }

  async crawl(): Promise<CrawlResult> {
    const startTime = new Date();
    const pages: PageData[] = [];

    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const robotsData = this.options.respectRobotsTxt
        ? await this.robotsParser.parse()
        : undefined;

      let sitemapData = undefined;
      if (this.options.includeSitemap) {
        const sitemapUrls = robotsData?.sitemapUrls;
        sitemapData = await this.sitemapParser.parse(sitemapUrls);
      }

      this.urlQueue.push({ url: this.baseUrl, depth: 0 });

      while (
        this.urlQueue.length > 0 &&
        pages.length < (this.options.maxPages || DEFAULT_OPTIONS.maxPages!)
      ) {
        const item = this.urlQueue.shift();
        if (!item) break;

        const { url, depth } = item;

        if (this.visitedUrls.has(url)) continue;
        if (depth > (this.options.maxDepth || DEFAULT_OPTIONS.maxDepth!)) continue;

        const path = new URL(url).pathname;
        if (robotsData && !this.robotsParser.isPathAllowed(path, robotsData)) {
          continue;
        }

        this.visitedUrls.add(url);

        try {
          const pageData = await this.crawlPage(url);
          pages.push(pageData);

          if (depth < (this.options.maxDepth || DEFAULT_OPTIONS.maxDepth!)) {
            const parser = new PageParser(pageData.html, url);
            const links = parser.getLinks();

            for (const link of links) {
              if (
                link.isInternal &&
                !this.visitedUrls.has(link.href) &&
                !link.href.includes('#')
              ) {
                this.urlQueue.push({ url: link.href, depth: depth + 1 });
              }
            }
          }
        } catch (error) {
          console.error(`Error crawling ${url}:`, error);
        }
      }

      return {
        url: this.baseUrl,
        pages,
        robotsTxt: robotsData,
        sitemap: sitemapData,
        startTime,
        endTime: new Date(),
      };
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  private async crawlPage(url: string): Promise<PageData> {
    if (!this.browser) throw new Error('Browser not initialized');

    const page = await this.browser.newPage();

    try {
      await page.setUserAgent(this.options.userAgent || DEFAULT_OPTIONS.userAgent!);
      await page.setViewport(this.options.viewport || DEFAULT_OPTIONS.viewport!);

      const resources: ResourceData[] = [];
      const resourceStartTimes = new Map<string, number>();

      page.on('request', (request) => {
        resourceStartTimes.set(request.url(), Date.now());
      });

      page.on('response', async (response) => {
        const resourceUrl = response.url();
        const startTime = resourceStartTimes.get(resourceUrl) || Date.now();
        const resourceType = response.request().resourceType();

        let type: ResourceData['type'] = 'other';
        if (resourceType === 'script') type = 'script';
        else if (resourceType === 'stylesheet') type = 'stylesheet';
        else if (resourceType === 'image') type = 'image';
        else if (resourceType === 'font') type = 'font';

        try {
          const headers = response.headers();
          const size = parseInt(headers['content-length'] || '0', 10);

          resources.push({
            url: resourceUrl,
            type,
            size,
            loadTime: Date.now() - startTime,
          });
        } catch {
          // Ignore errors for resource tracking
        }
      });

      const startTime = Date.now();

      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.options.timeout,
      });

      if (this.options.waitForSelector) {
        await page.waitForSelector(this.options.waitForSelector, {
          timeout: this.options.timeout,
        });
      }

      const loadTime = Date.now() - startTime;
      const html = await page.content();
      const statusCode = response?.status() || 0;

      const headers: Record<string, string> = {};
      const responseHeaders = response?.headers() || {};
      for (const [key, value] of Object.entries(responseHeaders)) {
        headers[key] = value;
      }

      return {
        url,
        html,
        statusCode,
        headers,
        loadTime,
        resources,
      };
    } finally {
      await page.close();
    }
  }

  async crawlSinglePage(url: string): Promise<PageData> {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      return await this.crawlPage(url);
    } finally {
      await this.browser.close();
    }
  }
}
