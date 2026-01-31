import type { PlatformInfo } from '../types/index.js';
import { BasePlatformDetector } from './BasePlatformDetector.js';

export class ShopifyDetector extends BasePlatformDetector {
  detect(): PlatformInfo | null {
    const html = this.pageData.html;
    const headers = this.pageData.headers;

    // Check for Shopify indicators
    const isShopify = this.checkShopifyIndicators(html, headers);

    if (!isShopify) {
      return null;
    }

    return {
      name: 'shopify',
      version: this.detectVersion(html),
      theme: this.detectTheme(html),
      plugins: this.detectApps(html),
    };
  }

  private checkShopifyIndicators(html: string, headers: Record<string, string>): boolean {
    // Check headers
    if (headers['x-shopify-stage'] || headers['x-shopid']) {
      return true;
    }

    // Check common Shopify patterns in HTML
    const shopifyPatterns = [
      'cdn.shopify.com',
      'Shopify.theme',
      'shopify-section',
      'shopify_analytics',
      '/checkouts/internal',
      'myshopify.com',
      'window.ShopifyAnalytics',
      'Shopify.PaymentButton',
    ];

    for (const pattern of shopifyPatterns) {
      if (html.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  private detectVersion(html: string): string | undefined {
    // Shopify doesn't expose version directly
    // We can detect Shopify 2.0 (Online Store 2.0) by looking for certain features
    if (html.includes('sections/') && html.includes('templates/')) {
      return '2.0';
    }

    return undefined;
  }

  private detectTheme(html: string): string | undefined {
    // Try to extract theme name from comments or meta tags
    const themeMatch = html.match(/<!-- Theme: ([^>]+) -->/);
    if (themeMatch) {
      return themeMatch[1].trim();
    }

    // Check for common Shopify themes
    const themes: Record<string, string[]> = {
      Dawn: ['Dawn', 'sections/header-group', 'predictive-search'],
      Debut: ['Debut', 'debut-theme'],
      Brooklyn: ['Brooklyn', 'brooklyn-theme'],
      Narrative: ['Narrative', 'narrative-theme'],
      Simple: ['Simple', 'simple-theme'],
      Minimal: ['Minimal', 'minimal-theme'],
      Supply: ['Supply', 'supply-theme'],
      Venture: ['Venture', 'venture-theme'],
      Boundless: ['Boundless', 'boundless-theme'],
    };

    for (const [theme, patterns] of Object.entries(themes)) {
      for (const pattern of patterns) {
        if (html.includes(pattern)) {
          return theme;
        }
      }
    }

    return undefined;
  }

  private detectApps(html: string): string[] {
    const apps: string[] = [];

    // Common Shopify apps detection
    const appPatterns: Record<string, string[]> = {
      Klaviyo: ['klaviyo', 'learnq'],
      Yotpo: ['yotpo', 'staticw2.yotpo'],
      'Judge.me': ['judge.me', 'judgeme'],
      Privy: ['privy.com'],
      Smile: ['smile.io', 'sweettooth'],
      Recharge: ['rechargeapps', 'recharge-subscription'],
      Bold: ['boldapps.net', 'bold-product'],
      Loox: ['loox.io'],
      Stamped: ['stamped.io'],
      PageFly: ['pagefly'],
      GemPages: ['gempages'],
      Shogun: ['shogun'],
    };

    for (const [app, patterns] of Object.entries(appPatterns)) {
      for (const pattern of patterns) {
        if (html.toLowerCase().includes(pattern.toLowerCase())) {
          apps.push(app);
          break;
        }
      }
    }

    return apps;
  }
}
