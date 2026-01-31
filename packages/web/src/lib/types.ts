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
  resources: unknown[];
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
