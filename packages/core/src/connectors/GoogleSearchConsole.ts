import type { ConnectorConfig } from '../types/index.js';

export interface SearchAnalyticsRow {
  keys: string[];
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchAnalyticsResponse {
  rows: SearchAnalyticsRow[];
  responseAggregationType: string;
}

export interface SitemapInfo {
  path: string;
  lastSubmitted: string;
  isPending: boolean;
  isSitemapsIndex: boolean;
  type: string;
  lastDownloaded: string;
  warnings: number;
  errors: number;
}

export interface CrawlError {
  pageUrl: string;
  category: string;
  detectedDate: string;
  responseCode: number;
}

export class GoogleSearchConsole {
  private accessToken?: string;
  private refreshToken?: string;
  private clientId?: string;
  private clientSecret?: string;
  private baseUrl = 'https://www.googleapis.com/webmasters/v3';

  constructor(config?: ConnectorConfig) {
    this.clientId = config?.clientId;
    this.clientSecret = config?.clientSecret;
    this.refreshToken = config?.refreshToken;
  }

  async setAccessToken(token: string): Promise<void> {
    this.accessToken = token;
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.clientId || !this.clientSecret || !this.refreshToken) {
      throw new Error('Missing OAuth credentials. Configure clientId, clientSecret, and refreshToken');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: this.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.status}`);
    }

    const data = await response.json() as { access_token: string };
    this.accessToken = data.access_token;
    return data.access_token;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.accessToken) {
      await this.refreshAccessToken();
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (response.status === 401) {
      // Token expired, refresh and retry
      await this.refreshAccessToken();
      return this.request(endpoint, options);
    }

    if (!response.ok) {
      throw new Error(`GSC API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  async getSites(): Promise<{ siteUrl: string; permissionLevel: string }[]> {
    const data = await this.request<{ siteEntry: { siteUrl: string; permissionLevel: string }[] }>(
      '/sites'
    );
    return data.siteEntry || [];
  }

  async getSearchAnalytics(
    siteUrl: string,
    options: {
      startDate: string;
      endDate: string;
      dimensions?: ('query' | 'page' | 'country' | 'device' | 'date')[];
      rowLimit?: number;
      startRow?: number;
    }
  ): Promise<SearchAnalyticsResponse> {
    const encodedUrl = encodeURIComponent(siteUrl);

    return this.request<SearchAnalyticsResponse>(
      `/sites/${encodedUrl}/searchAnalytics/query`,
      {
        method: 'POST',
        body: JSON.stringify({
          startDate: options.startDate,
          endDate: options.endDate,
          dimensions: options.dimensions || ['query'],
          rowLimit: options.rowLimit || 1000,
          startRow: options.startRow || 0,
        }),
      }
    );
  }

  async getTopQueries(
    siteUrl: string,
    days: number = 28
  ): Promise<SearchAnalyticsRow[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const response = await this.getSearchAnalytics(siteUrl, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['query'],
      rowLimit: 100,
    });

    return response.rows || [];
  }

  async getTopPages(
    siteUrl: string,
    days: number = 28
  ): Promise<SearchAnalyticsRow[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const response = await this.getSearchAnalytics(siteUrl, {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      dimensions: ['page'],
      rowLimit: 100,
    });

    return response.rows || [];
  }

  async getSitemaps(siteUrl: string): Promise<SitemapInfo[]> {
    const encodedUrl = encodeURIComponent(siteUrl);
    const data = await this.request<{ sitemap: SitemapInfo[] }>(
      `/sites/${encodedUrl}/sitemaps`
    );
    return data.sitemap || [];
  }

  async submitSitemap(siteUrl: string, sitemapUrl: string): Promise<void> {
    const encodedSiteUrl = encodeURIComponent(siteUrl);
    const encodedSitemapUrl = encodeURIComponent(sitemapUrl);

    await this.request(
      `/sites/${encodedSiteUrl}/sitemaps/${encodedSitemapUrl}`,
      { method: 'PUT' }
    );
  }
}
