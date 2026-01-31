import type { AnalyzerResult, Issue, PageData } from '../types/index.js';
import { PageParser } from '../crawler/PageParser.js';

export abstract class BaseAnalyzer {
  protected pageData: PageData;
  protected parser: PageParser;
  protected issues: Issue[] = [];

  constructor(pageData: PageData) {
    this.pageData = pageData;
    this.parser = new PageParser(pageData.html, pageData.url);
  }

  abstract get name(): string;
  abstract get maxScore(): number;
  abstract analyze(): Promise<AnalyzerResult>;

  protected addIssue(issue: Issue): void {
    this.issues.push(issue);
  }

  protected calculateScore(penaltyPoints: number): number {
    const score = Math.max(0, this.maxScore - penaltyPoints);
    return Math.round((score / this.maxScore) * 100);
  }
}
