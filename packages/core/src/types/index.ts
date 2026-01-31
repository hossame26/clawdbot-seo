export type Severity = 'critical' | 'warning' | 'info' | 'success';

export interface Issue {
  code: string;
  message: string;
  severity: Severity;
  element?: string;
  recommendation?: string;
  url?: string;
}

export interface AnalyzerResult {
  name: string;
  score: number;
  maxScore: number;
  issues: Issue[];
  data: Record<string, unknown>;
}

export interface PageData {
  url: string;
  html: string;
  statusCode: number;
  headers: Record<string, string>;
  loadTime: number;
  resources: ResourceData[];
}

export interface ResourceData {
  url: string;
  type: 'script' | 'stylesheet' | 'image' | 'font' | 'other';
  size: number;
  loadTime: number;
}

export interface CrawlResult {
  url: string;
  pages: PageData[];
  robotsTxt?: RobotsTxtData;
  sitemap?: SitemapData;
  startTime: Date;
  endTime: Date;
}

export interface RobotsTxtData {
  exists: boolean;
  content?: string;
  allowedPaths: string[];
  disallowedPaths: string[];
  sitemapUrls: string[];
}

export interface SitemapData {
  exists: boolean;
  urls: SitemapUrl[];
}

export interface SitemapUrl {
  url: string;
  lastmod?: string;
  priority?: number;
  changefreq?: string;
}

export interface MetaData {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  viewport?: string;
  charset?: string;
}

export interface HeadingData {
  level: number;
  text: string;
  order: number;
}

export interface LinkData {
  href: string;
  text: string;
  isInternal: boolean;
  isNofollow: boolean;
  statusCode?: number;
  isBroken?: boolean;
}

export interface ImageData {
  src: string;
  alt?: string;
  width?: number;
  height?: number;
  size?: number;
  format?: string;
  isLazyLoaded?: boolean;
}

export interface SchemaData {
  type: string;
  data: Record<string, unknown>;
  isValid: boolean;
  errors?: string[];
}

export interface SecurityData {
  isHttps: boolean;
  hasHSTS: boolean;
  hasCSP: boolean;
  hasXFrameOptions: boolean;
  hasXContentTypeOptions: boolean;
  hasReferrerPolicy: boolean;
  mixedContent: string[];
}

export interface PerformanceData {
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  timeToInteractive?: number;
  totalBlockingTime?: number;
  speedIndex?: number;
}

export interface AuditResult {
  url: string;
  timestamp: Date;
  platform: PlatformInfo;
  scores: {
    overall: number;
    technical: number;
    content: number;
    performance: number;
    mobile: number;
  };
  analyzers: AnalyzerResult[];
  issues: Issue[];
  recommendations: Recommendation[];
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  estimatedImpact: string;
}

export interface PlatformInfo {
  name: 'shopify' | 'wordpress' | 'custom' | 'unknown';
  version?: string;
  theme?: string;
  plugins?: string[];
  seoPlugin?: string;
}

export interface CrawlerOptions {
  maxPages?: number;
  maxDepth?: number;
  timeout?: number;
  userAgent?: string;
  respectRobotsTxt?: boolean;
  includeSitemap?: boolean;
  followExternalLinks?: boolean;
  waitForSelector?: string;
  viewport?: { width: number; height: number };
}

export interface AuditOptions extends CrawlerOptions {
  analyzers?: string[];
  skipPerformance?: boolean;
  includeScreenshots?: boolean;
  outputFormat?: 'json' | 'html';
}

export interface ConnectorConfig {
  apiKey?: string;
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
}

export interface PageSpeedResult {
  score: number;
  metrics: PerformanceData;
  opportunities: Opportunity[];
  diagnostics: Diagnostic[];
}

export interface Opportunity {
  id: string;
  title: string;
  description: string;
  score: number;
  numericValue?: number;
  displayValue?: string;
}

export interface Diagnostic {
  id: string;
  title: string;
  description: string;
  details?: Record<string, unknown>;
}
