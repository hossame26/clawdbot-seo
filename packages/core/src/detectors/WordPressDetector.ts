import type { PlatformInfo } from '../types/index.js';
import { BasePlatformDetector } from './BasePlatformDetector.js';

export class WordPressDetector extends BasePlatformDetector {
  detect(): PlatformInfo | null {
    const html = this.pageData.html;

    // Check for WordPress indicators
    const isWordPress = this.checkWordPressIndicators(html);

    if (!isWordPress) {
      return null;
    }

    const plugins = this.detectPlugins(html);

    return {
      name: 'wordpress',
      version: this.detectVersion(html),
      theme: this.detectTheme(html),
      plugins,
      seoPlugin: this.detectSeoPlugin(plugins),
    };
  }

  private checkWordPressIndicators(html: string): boolean {
    const wordpressPatterns = [
      'wp-content/',
      'wp-includes/',
      'wp-json/',
      'wordpress',
      '/xmlrpc.php',
      'wp-embed.min.js',
      'woocommerce',
      'generator" content="WordPress',
    ];

    for (const pattern of wordpressPatterns) {
      if (html.toLowerCase().includes(pattern.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  private detectVersion(html: string): string | undefined {
    // Check meta generator tag
    const generatorMatch = html.match(/generator" content="WordPress ([0-9.]+)/i);
    if (generatorMatch) {
      return generatorMatch[1];
    }

    // Check for version in script/style URLs
    const versionMatch = html.match(/wp-includes\/[^"]+\?ver=([0-9.]+)/);
    if (versionMatch) {
      return versionMatch[1];
    }

    return undefined;
  }

  private detectTheme(html: string): string | undefined {
    // Extract theme from wp-content/themes path
    const themeMatch = html.match(/wp-content\/themes\/([^/"]+)/);
    if (themeMatch) {
      return themeMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    return undefined;
  }

  private detectPlugins(html: string): string[] {
    const plugins: string[] = [];
    const pluginPatterns: Record<string, string[]> = {
      // SEO Plugins
      Yoast: ['yoast', 'wpseo'],
      'Rank Math': ['rank-math', 'rankmath'],
      'All in One SEO': ['aioseo', 'all-in-one-seo'],
      'SEOPress': ['seopress'],
      'The SEO Framework': ['the-seo-framework', 'tsf-'],

      // WooCommerce
      WooCommerce: ['woocommerce', 'wc-'],

      // Page Builders
      Elementor: ['elementor'],
      'WPBakery': ['wpbakery', 'js_composer'],
      Divi: ['divi', 'et-'],
      'Beaver Builder': ['beaver-builder', 'fl-'],
      Gutenberg: ['wp-block-'],

      // Performance
      'WP Rocket': ['wp-rocket', 'rocket-'],
      Autoptimize: ['autoptimize'],
      'W3 Total Cache': ['w3-total-cache', 'w3tc'],
      'LiteSpeed Cache': ['litespeed'],

      // Security
      Wordfence: ['wordfence'],
      Sucuri: ['sucuri'],
      'iThemes Security': ['ithemes-security', 'better-wp-security'],

      // Forms
      'Contact Form 7': ['contact-form-7', 'wpcf7'],
      'WPForms': ['wpforms'],
      'Gravity Forms': ['gravityforms', 'gform'],

      // Others
      Jetpack: ['jetpack'],
      'Akismet': ['akismet'],
      'MonsterInsights': ['monsterinsights'],
      'WPML': ['wpml'],
      'Polylang': ['polylang'],
    };

    const htmlLower = html.toLowerCase();

    for (const [plugin, patterns] of Object.entries(pluginPatterns)) {
      for (const pattern of patterns) {
        if (htmlLower.includes(pattern.toLowerCase())) {
          plugins.push(plugin);
          break;
        }
      }
    }

    return plugins;
  }

  private detectSeoPlugin(plugins: string[]): string | undefined {
    const seoPlugins = ['Yoast', 'Rank Math', 'All in One SEO', 'SEOPress', 'The SEO Framework'];

    for (const plugin of seoPlugins) {
      if (plugins.includes(plugin)) {
        return plugin;
      }
    }

    return undefined;
  }
}
