import type { PlatformInfo, PageData } from '../types/index.js';
import { BasePlatformDetector } from './BasePlatformDetector.js';
import { ShopifyDetector } from './ShopifyDetector.js';
import { WordPressDetector } from './WordPressDetector.js';

export { BasePlatformDetector } from './BasePlatformDetector.js';

export class PlatformDetector {
  private pageData: PageData;

  constructor(pageData: PageData) {
    this.pageData = pageData;
  }

  detect(): PlatformInfo {
    // Try each detector in order of specificity
    const detectors = [
      new ShopifyDetector(this.pageData),
      new WordPressDetector(this.pageData),
    ];

    for (const detector of detectors) {
      const result = detector.detect();
      if (result) {
        return result;
      }
    }

    // Check for other common platforms
    const html = this.pageData.html.toLowerCase();

    if (html.includes('wix.com') || html.includes('wixsite')) {
      return {
        name: 'custom',
        version: undefined,
        theme: 'Wix',
      };
    }

    if (html.includes('squarespace')) {
      return {
        name: 'custom',
        version: undefined,
        theme: 'Squarespace',
      };
    }

    if (html.includes('webflow')) {
      return {
        name: 'custom',
        version: undefined,
        theme: 'Webflow',
      };
    }

    return {
      name: 'custom',
    };
  }
}

export { ShopifyDetector } from './ShopifyDetector.js';
export { WordPressDetector } from './WordPressDetector.js';
