import { BaseAnalyzer } from './BaseAnalyzer.js';
import type { AnalyzerResult, SchemaData } from '../types/index.js';

export class SchemaAnalyzer extends BaseAnalyzer {
  get name(): string {
    return 'Structured Data';
  }

  get maxScore(): number {
    return 100;
  }

  async analyze(): Promise<AnalyzerResult> {
    const schemas = this.parser.getSchemaData();
    let penalty = 0;

    if (schemas.length === 0) {
      this.addIssue({
        code: 'NO_STRUCTURED_DATA',
        message: 'Page has no structured data (JSON-LD)',
        severity: 'warning',
        recommendation: 'Add JSON-LD structured data to help search engines understand your content',
      });
      penalty += 25;
    } else {
      penalty += this.analyzeSchemaValidity(schemas);
      penalty += this.analyzeSchemaTypes(schemas);
      penalty += this.analyzeSchemaCompleteness(schemas);
    }

    return {
      name: this.name,
      score: this.calculateScore(penalty),
      maxScore: this.maxScore,
      issues: this.issues,
      data: {
        schemas,
        schemaTypes: schemas.map(s => s.type),
      },
    };
  }

  private analyzeSchemaValidity(schemas: SchemaData[]): number {
    let penalty = 0;

    const invalidSchemas = schemas.filter(s => !s.isValid);
    if (invalidSchemas.length > 0) {
      this.addIssue({
        code: 'INVALID_SCHEMA',
        message: `${invalidSchemas.length} structured data blocks have parsing errors`,
        severity: 'critical',
        element: invalidSchemas.map(s => s.errors?.join(', ')).join('; '),
        recommendation: 'Fix JSON-LD syntax errors to ensure search engines can parse the data',
      });
      penalty += invalidSchemas.length * 10;
    }

    return penalty;
  }

  private analyzeSchemaTypes(schemas: SchemaData[]): number {
    const validSchemas = schemas.filter(s => s.isValid);
    const types = validSchemas.map(s => s.type);

    const recommendedTypes = [
      'Organization',
      'WebSite',
      'WebPage',
      'Article',
      'Product',
      'LocalBusiness',
      'BreadcrumbList',
      'FAQPage',
    ];

    const hasRecommendedType = types.some(t =>
      recommendedTypes.some(rt => t.includes(rt))
    );

    if (!hasRecommendedType && validSchemas.length > 0) {
      this.addIssue({
        code: 'UNCOMMON_SCHEMA_TYPE',
        message: `Schema types used: ${types.join(', ')}`,
        severity: 'info',
        recommendation: 'Consider adding common schema types like Organization, WebPage, or Article',
      });
      return 5;
    }

    return 0;
  }

  private analyzeSchemaCompleteness(schemas: SchemaData[]): number {
    let penalty = 0;

    for (const schema of schemas.filter(s => s.isValid)) {
      const issues = this.validateSchemaCompleteness(schema);
      penalty += issues;
    }

    return penalty;
  }

  private validateSchemaCompleteness(schema: SchemaData): number {
    const { type, data } = schema;
    let penalty = 0;

    // Common required fields by type
    const requiredFields: Record<string, string[]> = {
      Organization: ['name', 'url'],
      LocalBusiness: ['name', 'address', 'telephone'],
      Product: ['name', 'image'],
      Article: ['headline', 'author', 'datePublished'],
      Person: ['name'],
      WebSite: ['name', 'url'],
      BreadcrumbList: ['itemListElement'],
      FAQPage: ['mainEntity'],
    };

    const required = requiredFields[type];
    if (required) {
      const missing = required.filter(field => !data[field]);
      if (missing.length > 0) {
        this.addIssue({
          code: 'INCOMPLETE_SCHEMA',
          message: `${type} schema is missing recommended fields: ${missing.join(', ')}`,
          severity: 'info',
          recommendation: `Add missing fields to improve rich result eligibility`,
        });
        penalty += missing.length * 2;
      }
    }

    // Check for image in visual schemas
    const visualTypes = ['Product', 'Article', 'Recipe', 'Event'];
    if (visualTypes.includes(type) && !data['image']) {
      this.addIssue({
        code: 'SCHEMA_MISSING_IMAGE',
        message: `${type} schema is missing image property`,
        severity: 'info',
        recommendation: 'Add an image to improve rich result appearance in search',
      });
      penalty += 5;
    }

    return penalty;
  }
}
