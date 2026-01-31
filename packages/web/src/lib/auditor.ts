import * as cheerio from 'cheerio';
import type { AuditResult, PageData, Issue, Recommendation, AnalyzerResult, PlatformInfo } from './types';

async function fetchPage(url: string): Promise<PageData> {
  const startTime = Date.now();

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'ClawdBot SEO Crawler/1.0',
    },
  });

  const html = await response.text();
  const loadTime = Date.now() - startTime;

  const headers: Record<string, string> = {};
  response.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return {
    url,
    html,
    statusCode: response.status,
    headers,
    loadTime,
    resources: [],
  };
}

function analyzeMetaTags(html: string): AnalyzerResult {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];
  let penalty = 0;

  const title = $('title').text().trim();
  if (!title) {
    issues.push({
      code: 'MISSING_TITLE',
      message: 'Page is missing a title tag',
      severity: 'critical',
      recommendation: 'Add a unique, descriptive title tag between 30-60 characters',
    });
    penalty += 25;
  } else if (title.length < 30) {
    issues.push({
      code: 'TITLE_TOO_SHORT',
      message: `Title is too short (${title.length} characters)`,
      severity: 'warning',
      recommendation: 'Title should be between 30-60 characters',
    });
    penalty += 10;
  } else if (title.length > 60) {
    issues.push({
      code: 'TITLE_TOO_LONG',
      message: `Title is too long (${title.length} characters)`,
      severity: 'warning',
      recommendation: 'Title may be truncated. Keep it under 60 characters',
    });
    penalty += 5;
  }

  const description = $('meta[name="description"]').attr('content');
  if (!description) {
    issues.push({
      code: 'MISSING_DESCRIPTION',
      message: 'Page is missing a meta description',
      severity: 'critical',
      recommendation: 'Add a compelling meta description between 120-160 characters',
    });
    penalty += 20;
  } else if (description.length < 120) {
    issues.push({
      code: 'DESCRIPTION_TOO_SHORT',
      message: `Meta description is too short (${description.length} characters)`,
      severity: 'warning',
      recommendation: 'Meta description should be between 120-160 characters',
    });
    penalty += 8;
  }

  if (!$('link[rel="canonical"]').attr('href')) {
    issues.push({
      code: 'MISSING_CANONICAL',
      message: 'Page is missing a canonical URL',
      severity: 'warning',
      recommendation: 'Add a canonical tag to prevent duplicate content issues',
    });
    penalty += 10;
  }

  if (!$('meta[name="viewport"]').attr('content')) {
    issues.push({
      code: 'MISSING_VIEWPORT',
      message: 'Page is missing viewport meta tag',
      severity: 'critical',
      recommendation: 'Add viewport meta tag for mobile responsiveness',
    });
    penalty += 15;
  }

  return {
    name: 'Meta Tags',
    score: Math.max(0, 100 - penalty),
    maxScore: 100,
    issues,
    data: { title, description },
  };
}

function analyzeHeadings(html: string): AnalyzerResult {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];
  let penalty = 0;

  const h1s = $('h1');
  if (h1s.length === 0) {
    issues.push({
      code: 'MISSING_H1',
      message: 'Page is missing an H1 heading',
      severity: 'critical',
      recommendation: 'Add a single, descriptive H1 heading',
    });
    penalty += 30;
  } else if (h1s.length > 1) {
    issues.push({
      code: 'MULTIPLE_H1',
      message: `Page has ${h1s.length} H1 headings`,
      severity: 'warning',
      recommendation: 'Use only one H1 heading per page',
    });
    penalty += 15;
  }

  return {
    name: 'Headings Structure',
    score: Math.max(0, 100 - penalty),
    maxScore: 100,
    issues,
    data: { h1Count: h1s.length },
  };
}

function analyzeImages(html: string): AnalyzerResult {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];
  let penalty = 0;

  const images = $('img');
  const missingAlt = images.filter((_, el) => !$(el).attr('alt')).length;

  if (missingAlt > 0) {
    const percentage = Math.round((missingAlt / images.length) * 100);
    issues.push({
      code: 'MISSING_ALT_TAGS',
      message: `${missingAlt} images (${percentage}%) are missing alt text`,
      severity: percentage > 50 ? 'critical' : 'warning',
      recommendation: 'Add descriptive alt text to all images',
    });
    penalty += Math.min(missingAlt * 3, 30);
  }

  return {
    name: 'Images',
    score: Math.max(0, 100 - penalty),
    maxScore: 100,
    issues,
    data: { totalImages: images.length, missingAlt },
  };
}

function analyzeLinks(html: string, baseUrl: string): AnalyzerResult {
  const $ = cheerio.load(html);
  const issues: Issue[] = [];
  let penalty = 0;

  const links = $('a[href]');
  const baseHost = new URL(baseUrl).host;

  let internalLinks = 0;
  let externalLinks = 0;
  let emptyAnchors = 0;

  links.each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();

    if (!text) emptyAnchors++;

    try {
      const linkUrl = new URL(href, baseUrl);
      if (linkUrl.host === baseHost) {
        internalLinks++;
      } else {
        externalLinks++;
      }
    } catch {
      // Relative or invalid URL
      internalLinks++;
    }
  });

  if (emptyAnchors > 0) {
    issues.push({
      code: 'EMPTY_ANCHOR_TEXT',
      message: `${emptyAnchors} links have no anchor text`,
      severity: 'warning',
      recommendation: 'Add descriptive anchor text to all links',
    });
    penalty += Math.min(emptyAnchors * 2, 20);
  }

  if (internalLinks === 0 && links.length > 0) {
    issues.push({
      code: 'NO_INTERNAL_LINKS',
      message: 'Page has no internal links',
      severity: 'warning',
      recommendation: 'Add internal links to help users navigate',
    });
    penalty += 15;
  }

  return {
    name: 'Links',
    score: Math.max(0, 100 - penalty),
    maxScore: 100,
    issues,
    data: { totalLinks: links.length, internalLinks, externalLinks },
  };
}

function analyzePerformance(pageData: PageData): AnalyzerResult {
  const issues: Issue[] = [];
  let penalty = 0;

  if (pageData.loadTime > 5000) {
    issues.push({
      code: 'SLOW_PAGE',
      message: `Page load time is very slow (${(pageData.loadTime / 1000).toFixed(1)}s)`,
      severity: 'critical',
      recommendation: 'Optimize page speed. Aim for under 3 seconds',
    });
    penalty += 25;
  } else if (pageData.loadTime > 3000) {
    issues.push({
      code: 'MODERATE_LOAD_TIME',
      message: `Page load time is moderate (${(pageData.loadTime / 1000).toFixed(1)}s)`,
      severity: 'warning',
      recommendation: 'Consider optimizing for faster load times',
    });
    penalty += 10;
  }

  if (!pageData.url.startsWith('https')) {
    issues.push({
      code: 'NOT_HTTPS',
      message: 'Site is not using HTTPS',
      severity: 'critical',
      recommendation: 'Enable HTTPS for security and SEO',
    });
    penalty += 20;
  }

  return {
    name: 'Technical SEO',
    score: Math.max(0, 100 - penalty),
    maxScore: 100,
    issues,
    data: { loadTime: pageData.loadTime, isHttps: pageData.url.startsWith('https') },
  };
}

function detectPlatform(html: string): PlatformInfo {
  const htmlLower = html.toLowerCase();

  if (htmlLower.includes('cdn.shopify.com') || htmlLower.includes('shopify')) {
    return { name: 'shopify' };
  }

  if (htmlLower.includes('wp-content/') || htmlLower.includes('wordpress')) {
    return { name: 'wordpress' };
  }

  return { name: 'custom' };
}

function generateRecommendations(issues: Issue[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  for (const issue of issues.filter(i => i.severity === 'critical')) {
    if (issue.recommendation) {
      recommendations.push({
        title: issue.message.split(' ').slice(0, 4).join(' '),
        description: issue.recommendation,
        priority: 'high',
        category: 'SEO',
        estimatedImpact: 'High impact on SEO',
      });
    }
  }

  for (const issue of issues.filter(i => i.severity === 'warning').slice(0, 5)) {
    if (issue.recommendation) {
      recommendations.push({
        title: issue.message.split(' ').slice(0, 4).join(' '),
        description: issue.recommendation,
        priority: 'medium',
        category: 'SEO',
        estimatedImpact: 'Moderate impact',
      });
    }
  }

  return recommendations;
}

export async function runLightAudit(url: string): Promise<AuditResult> {
  const pageData = await fetchPage(url);

  const analyzers: AnalyzerResult[] = [
    analyzeMetaTags(pageData.html),
    analyzeHeadings(pageData.html),
    analyzeImages(pageData.html),
    analyzeLinks(pageData.html, url),
    analyzePerformance(pageData),
  ];

  const allIssues = analyzers.flatMap(a => a.issues);
  const overall = Math.round(analyzers.reduce((sum, a) => sum + a.score, 0) / analyzers.length);

  return {
    url,
    timestamp: new Date(),
    platform: detectPlatform(pageData.html),
    scores: {
      overall,
      technical: analyzers.find(a => a.name === 'Technical SEO')?.score || 0,
      content: Math.round((
        (analyzers.find(a => a.name === 'Meta Tags')?.score || 0) +
        (analyzers.find(a => a.name === 'Headings Structure')?.score || 0)
      ) / 2),
      performance: analyzers.find(a => a.name === 'Technical SEO')?.score || 0,
      mobile: 80,
    },
    analyzers,
    issues: allIssues,
    recommendations: generateRecommendations(allIssues),
  };
}
