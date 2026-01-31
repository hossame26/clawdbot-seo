export { BaseAnalyzer } from './BaseAnalyzer.js';
export { MetaAnalyzer } from './MetaAnalyzer.js';
export { HeadingAnalyzer } from './HeadingAnalyzer.js';
export { ContentAnalyzer } from './ContentAnalyzer.js';
export { LinkAnalyzer } from './LinkAnalyzer.js';
export { ImageAnalyzer } from './ImageAnalyzer.js';
export { TechnicalAnalyzer } from './TechnicalAnalyzer.js';
export { MobileAnalyzer } from './MobileAnalyzer.js';
export { SchemaAnalyzer } from './SchemaAnalyzer.js';
export { SecurityAnalyzer } from './SecurityAnalyzer.js';

import type { PageData, AnalyzerResult } from '../types/index.js';
import { MetaAnalyzer } from './MetaAnalyzer.js';
import { HeadingAnalyzer } from './HeadingAnalyzer.js';
import { ContentAnalyzer } from './ContentAnalyzer.js';
import { LinkAnalyzer } from './LinkAnalyzer.js';
import { ImageAnalyzer } from './ImageAnalyzer.js';
import { TechnicalAnalyzer } from './TechnicalAnalyzer.js';
import { MobileAnalyzer } from './MobileAnalyzer.js';
import { SchemaAnalyzer } from './SchemaAnalyzer.js';
import { SecurityAnalyzer } from './SecurityAnalyzer.js';

export async function runAllAnalyzers(pageData: PageData): Promise<AnalyzerResult[]> {
  const analyzers = [
    new MetaAnalyzer(pageData),
    new HeadingAnalyzer(pageData),
    new ContentAnalyzer(pageData),
    new LinkAnalyzer(pageData),
    new ImageAnalyzer(pageData),
    new TechnicalAnalyzer(pageData),
    new MobileAnalyzer(pageData),
    new SchemaAnalyzer(pageData),
    new SecurityAnalyzer(pageData),
  ];

  const results = await Promise.all(analyzers.map(a => a.analyze()));
  return results;
}

export function calculateOverallScore(results: AnalyzerResult[]): {
  overall: number;
  technical: number;
  content: number;
  performance: number;
  mobile: number;
} {
  const technicalAnalyzers = ['Technical SEO', 'Security'];
  const contentAnalyzers = ['Meta Tags', 'Headings Structure', 'Content Quality', 'Structured Data'];
  const performanceAnalyzers = ['Technical SEO', 'Images'];
  const mobileAnalyzers = ['Mobile Friendliness'];

  const getAverageScore = (names: string[]): number => {
    const relevant = results.filter(r => names.includes(r.name));
    if (relevant.length === 0) return 100;
    return Math.round(relevant.reduce((sum, r) => sum + r.score, 0) / relevant.length);
  };

  const overall = Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length);

  return {
    overall,
    technical: getAverageScore(technicalAnalyzers),
    content: getAverageScore(contentAnalyzers),
    performance: getAverageScore(performanceAnalyzers),
    mobile: getAverageScore(mobileAnalyzers),
  };
}
