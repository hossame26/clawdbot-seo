import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import { SEOAuditor, type AuditOptions } from '@clawdbot/core';
import {
  displayHeader,
  displayScores,
  displayPlatform,
  displayIssuesSummary,
  displayIssues,
  displayAnalyzers,
  displayRecommendations,
  displayFooter,
} from '../utils/display.js';

interface AuditCommandOptions {
  quick?: boolean;
  format?: 'json' | 'html';
  output?: string;
  maxPages?: string;
  maxDepth?: string;
  verbose?: boolean;
}

export function createAuditCommand(): Command {
  const command = new Command('audit')
    .description('Run a full SEO audit on a website')
    .argument('<url>', 'URL to audit')
    .option('-q, --quick', 'Quick audit (single page only)', false)
    .option('-f, --format <format>', 'Output format (json, html)', 'json')
    .option('-o, --output <file>', 'Save report to file')
    .option('--max-pages <number>', 'Maximum pages to crawl', '100')
    .option('--max-depth <number>', 'Maximum crawl depth', '3')
    .option('-v, --verbose', 'Show detailed output', false)
    .action(async (url: string, options: AuditCommandOptions) => {
      displayHeader();

      // Validate URL
      try {
        new URL(url);
      } catch {
        console.error(chalk.red('Error: Invalid URL provided'));
        process.exit(1);
      }

      const spinner = ora('Starting SEO audit...').start();

      const auditOptions: AuditOptions = {
        maxPages: options.quick ? 1 : parseInt(options.maxPages || '100', 10),
        maxDepth: options.quick ? 0 : parseInt(options.maxDepth || '3', 10),
      };

      const auditor = new SEOAuditor(auditOptions);

      try {
        spinner.text = 'Crawling website...';

        const result = options.quick
          ? await auditor.auditUrl(url)
          : (await auditor.auditSite(url))[0];

        spinner.succeed('Audit completed!');

        // Display results
        displayScores(result);
        displayPlatform(result);
        displayIssuesSummary(result.issues);

        if (options.verbose) {
          displayAnalyzers(result.analyzers);

          console.log(chalk.bold('\n🔴 Critical Issues'));
          displayIssues(result.issues, 'critical');

          console.log(chalk.bold('\n🟡 Warnings'));
          displayIssues(result.issues, 'warning');
        } else {
          // Show only critical issues in non-verbose mode
          const criticalIssues = result.issues.filter(i => i.severity === 'critical');
          if (criticalIssues.length > 0) {
            console.log(chalk.bold('\n🔴 Critical Issues'));
            displayIssues(criticalIssues);
          }
        }

        displayRecommendations(result);
        displayFooter(url);

        // Save report if output specified
        if (options.output) {
          const format = options.format || 'json';
          const report = auditor.generateReport(result, format);

          await fs.writeFile(options.output, report, 'utf-8');
          console.log(chalk.green(`\n✓ Report saved to ${options.output}`));
        }

      } catch (error) {
        spinner.fail('Audit failed');
        console.error(chalk.red(`\nError: ${(error as Error).message}`));
        if (options.verbose) {
          console.error(error);
        }
        process.exit(1);
      }
    });

  return command;
}
