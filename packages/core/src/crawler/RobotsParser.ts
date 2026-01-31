import type { RobotsTxtData } from '../types/index.js';

export class RobotsParser {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async parse(): Promise<RobotsTxtData> {
    const robotsUrl = new URL('/robots.txt', this.baseUrl).href;

    try {
      const response = await fetch(robotsUrl);

      if (!response.ok) {
        return {
          exists: false,
          allowedPaths: [],
          disallowedPaths: [],
          sitemapUrls: [],
        };
      }

      const content = await response.text();
      return this.parseContent(content);
    } catch {
      return {
        exists: false,
        allowedPaths: [],
        disallowedPaths: [],
        sitemapUrls: [],
      };
    }
  }

  private parseContent(content: string): RobotsTxtData {
    const allowedPaths: string[] = [];
    const disallowedPaths: string[] = [];
    const sitemapUrls: string[] = [];

    const lines = content.split('\n');
    let currentUserAgent = '';
    let isRelevantUserAgent = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith('#') || trimmed === '') {
        continue;
      }

      const colonIndex = trimmed.indexOf(':');
      if (colonIndex === -1) continue;

      const directive = trimmed.substring(0, colonIndex).toLowerCase().trim();
      const value = trimmed.substring(colonIndex + 1).trim();

      switch (directive) {
        case 'user-agent':
          currentUserAgent = value;
          isRelevantUserAgent = value === '*' || value.toLowerCase().includes('bot');
          break;

        case 'allow':
          if (isRelevantUserAgent && value) {
            allowedPaths.push(value);
          }
          break;

        case 'disallow':
          if (isRelevantUserAgent && value) {
            disallowedPaths.push(value);
          }
          break;

        case 'sitemap':
          if (value) {
            sitemapUrls.push(value);
          }
          break;
      }
    }

    return {
      exists: true,
      content,
      allowedPaths: [...new Set(allowedPaths)],
      disallowedPaths: [...new Set(disallowedPaths)],
      sitemapUrls: [...new Set(sitemapUrls)],
    };
  }

  isPathAllowed(path: string, robotsData: RobotsTxtData): boolean {
    if (!robotsData.exists) {
      return true;
    }

    for (const disallowed of robotsData.disallowedPaths) {
      if (this.matchPath(path, disallowed)) {
        for (const allowed of robotsData.allowedPaths) {
          if (this.matchPath(path, allowed) && allowed.length > disallowed.length) {
            return true;
          }
        }
        return false;
      }
    }

    return true;
  }

  private matchPath(path: string, pattern: string): boolean {
    if (pattern === '/') {
      return true;
    }

    if (pattern.endsWith('$')) {
      const cleanPattern = pattern.slice(0, -1);
      return path === cleanPattern;
    }

    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*'));
      return regex.test(path);
    }

    return path.startsWith(pattern);
  }
}
