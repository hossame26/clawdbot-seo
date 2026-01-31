import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import { SEOAuditor } from '@clawdbot/core';
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

interface PageCommandOptions {
  format?: 'json' | 'html';
  output?: string;
  verbose?: boolean;
}

export function createPageCommand(): Command {
  const command = new Command('page')
    .description('Analyze a single page')
    .argument('<url>', 'Page URL to analyze')
    .option('-f, --format <format>', 'Output format (json, html)', 'json')
    .option('-o, --output <file>', 'Save report to file')
    .option('-v, --verbose', 'Show detailed output', false)
    .action(async (url: string, options: PageCommandOptions) => {
      displayHeader();

      // Validate URL
      try {
        new URL(url);
      } catch {
        console.error(chalk.red('Error: Invalid URL provided'));
        process.exit(1);
      }

      const spinner = ora('Analyzing page...').start();

      const auditor = new SEOAuditor({ maxPages: 1, maxDepth: 0 });

      try {
        spinner.text = 'Fetching page...';
        const result = await auditor.auditUrl(url);

        spinner.succeed('Analysis completed!');

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

          console.log(chalk.bold('\n🔵 Info'));
          displayIssues(result.issues, 'info');
        } else {
          const criticalIssues = result.issues.filter(i => i.severity === 'critical');
          if (criticalIssues.length > 0) {
            console.log(chalk.bold('\n🔴 Critical Issues'));
            displayIssues(criticalIssues);
          }

          const warnings = result.issues.filter(i => i.severity === 'warning');
          if (warnings.length > 0) {
            console.log(chalk.bold('\n🟡 Top Warnings'));
            displayIssues(warnings.slice(0, 5));
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
        spinner.fail('Analysis failed');
        console.error(chalk.red(`\nError: ${(error as Error).message}`));
        if (options.verbose) {
          console.error(error);
        }
        process.exit(1);
      }
    });

  return command;
}
