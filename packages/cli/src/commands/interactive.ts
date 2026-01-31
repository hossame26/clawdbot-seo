import chalk from 'chalk';
import inquirer from 'inquirer';
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

interface MainMenuAnswers {
  action: 'audit' | 'page' | 'exit';
}

interface UrlAnswers {
  url: string;
}

interface AuditOptionsAnswers {
  quickMode: boolean;
  saveReport: boolean;
}

interface ReportOptionsAnswers {
  format: 'json' | 'html';
  filename: string;
}

export async function runInteractiveMode(): Promise<void> {
  displayHeader();

  while (true) {
    const { action } = await inquirer.prompt<MainMenuAnswers>([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: '🔍 Full Site Audit', value: 'audit' },
          { name: '📄 Single Page Analysis', value: 'page' },
          { name: '👋 Exit', value: 'exit' },
        ],
      },
    ]);

    if (action === 'exit') {
      console.log(chalk.gray('\nGoodbye!\n'));
      break;
    }

    const { url } = await inquirer.prompt<UrlAnswers>([
      {
        type: 'input',
        name: 'url',
        message: 'Enter the URL to analyze:',
        validate: (input: string) => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL (including https://)';
          }
        },
      },
    ]);

    let quickMode = action === 'page';

    if (action === 'audit') {
      const options = await inquirer.prompt<AuditOptionsAnswers>([
        {
          type: 'confirm',
          name: 'quickMode',
          message: 'Quick mode (single page only)?',
          default: false,
        },
      ]);
      quickMode = options.quickMode;
    }

    const spinner = ora('Starting analysis...').start();

    try {
      const auditor = new SEOAuditor({
        maxPages: quickMode ? 1 : 50,
        maxDepth: quickMode ? 0 : 2,
      });

      spinner.text = 'Crawling and analyzing...';

      const result = quickMode
        ? await auditor.auditUrl(url)
        : (await auditor.auditSite(url))[0];

      spinner.succeed('Analysis completed!');

      // Display results
      displayScores(result);
      displayPlatform(result);
      displayIssuesSummary(result.issues);

      // Show detailed view menu
      const { viewDetails } = await inquirer.prompt([
        {
          type: 'list',
          name: 'viewDetails',
          message: 'What would you like to see?',
          choices: [
            { name: '📊 Full Details', value: 'full' },
            { name: '🔴 Critical Issues Only', value: 'critical' },
            { name: '💡 Recommendations', value: 'recommendations' },
            { name: '⏭️  Skip Details', value: 'skip' },
          ],
        },
      ]);

      if (viewDetails === 'full') {
        displayAnalyzers(result.analyzers);
        console.log(chalk.bold('\n🔴 Critical Issues'));
        displayIssues(result.issues, 'critical');
        console.log(chalk.bold('\n🟡 Warnings'));
        displayIssues(result.issues, 'warning');
        displayRecommendations(result);
      } else if (viewDetails === 'critical') {
        console.log(chalk.bold('\n🔴 Critical Issues'));
        displayIssues(result.issues, 'critical');
      } else if (viewDetails === 'recommendations') {
        displayRecommendations(result);
      }

      displayFooter(url);

      // Save report option
      const { saveReport } = await inquirer.prompt<AuditOptionsAnswers>([
        {
          type: 'confirm',
          name: 'saveReport',
          message: 'Would you like to save the report?',
          default: false,
        },
      ]);

      if (saveReport) {
        const reportOptions = await inquirer.prompt<ReportOptionsAnswers>([
          {
            type: 'list',
            name: 'format',
            message: 'Report format:',
            choices: [
              { name: 'HTML (recommended)', value: 'html' },
              { name: 'JSON', value: 'json' },
            ],
          },
          {
            type: 'input',
            name: 'filename',
            message: 'Filename:',
            default: (answers: { format: string }) =>
              `seo-report-${new Date().toISOString().split('T')[0]}.${answers.format}`,
          },
        ]);

        const report = auditor.generateReport(result, reportOptions.format);
        await fs.writeFile(reportOptions.filename, report, 'utf-8');
        console.log(chalk.green(`\n✓ Report saved to ${reportOptions.filename}`));
      }

    } catch (error) {
      spinner.fail('Analysis failed');
      console.error(chalk.red(`\nError: ${(error as Error).message}`));
    }

    console.log('\n');
  }
}
