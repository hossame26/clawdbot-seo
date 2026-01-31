import chalk from 'chalk';
import Table from 'cli-table3';
import type { AuditResult, Issue, AnalyzerResult } from '@clawdbot/core';

export function displayHeader(): void {
  console.log(chalk.bold.magenta(`
   _______ __                      __ ____        __
  / ____/ /___ _      ______  ____/ // __ )____  / /_
 / /   / / __ \\ | /| / / __ \\/ __  // __  / __ \\/ __/
/ /___/ / /_/ / |/ |/ / /_/ / /_/ // /_/ / /_/ / /_
\\____/_/\\__,_/|__/|__/\\____/\\__,_//_____/\\____/\\__/
                                                  SEO
  `));
  console.log(chalk.gray('  AI-Powered SEO Auditor\n'));
}

export function getScoreColor(score: number): (text: string) => string {
  if (score >= 90) return chalk.green;
  if (score >= 70) return chalk.yellow;
  if (score >= 50) return chalk.hex('#FFA500');
  return chalk.red;
}

export function displayScores(result: AuditResult): void {
  const { scores } = result;

  console.log(chalk.bold('\n📊 SEO Scores\n'));

  const table = new Table({
    chars: {
      'top': '─', 'top-mid': '┬', 'top-left': '┌', 'top-right': '┐',
      'bottom': '─', 'bottom-mid': '┴', 'bottom-left': '└', 'bottom-right': '┘',
      'left': '│', 'left-mid': '├', 'mid': '─', 'mid-mid': '┼',
      'right': '│', 'right-mid': '┤', 'middle': '│'
    },
  });

  const formatScore = (label: string, score: number): string[] => {
    const color = getScoreColor(score);
    const bar = '█'.repeat(Math.floor(score / 5)) + '░'.repeat(20 - Math.floor(score / 5));
    return [chalk.bold(label), color(bar), color(`${score}/100`)];
  };

  table.push(
    formatScore('Overall', scores.overall),
    formatScore('Technical', scores.technical),
    formatScore('Content', scores.content),
    formatScore('Performance', scores.performance),
    formatScore('Mobile', scores.mobile),
  );

  console.log(table.toString());
}

export function displayPlatform(result: AuditResult): void {
  const { platform } = result;

  if (platform.name === 'custom' && !platform.theme) {
    return;
  }

  console.log(chalk.bold('\n🔍 Platform Detected\n'));

  const info: string[] = [];

  if (platform.name !== 'custom') {
    info.push(`Platform: ${chalk.cyan(platform.name)}`);
  }

  if (platform.version) {
    info.push(`Version: ${chalk.cyan(platform.version)}`);
  }

  if (platform.theme) {
    info.push(`Theme: ${chalk.cyan(platform.theme)}`);
  }

  if (platform.seoPlugin) {
    info.push(`SEO Plugin: ${chalk.green(platform.seoPlugin)}`);
  }

  if (platform.plugins && platform.plugins.length > 0) {
    info.push(`Detected Apps/Plugins: ${chalk.gray(platform.plugins.join(', '))}`);
  }

  for (const line of info) {
    console.log(`  ${line}`);
  }
}

export function displayIssuesSummary(issues: Issue[]): void {
  const critical = issues.filter(i => i.severity === 'critical').length;
  const warnings = issues.filter(i => i.severity === 'warning').length;
  const info = issues.filter(i => i.severity === 'info').length;

  console.log(chalk.bold('\n⚠️  Issues Summary\n'));
  console.log(`  ${chalk.red.bold(critical)} Critical  ${chalk.yellow.bold(warnings)} Warnings  ${chalk.blue.bold(info)} Info`);
}

export function displayIssues(issues: Issue[], severity?: Issue['severity']): void {
  const filteredIssues = severity ? issues.filter(i => i.severity === severity) : issues;

  if (filteredIssues.length === 0) {
    console.log(chalk.green('  No issues found!\n'));
    return;
  }

  for (const issue of filteredIssues) {
    const icon = issue.severity === 'critical' ? '🔴' :
                 issue.severity === 'warning' ? '🟡' : '🔵';

    const color = issue.severity === 'critical' ? chalk.red :
                  issue.severity === 'warning' ? chalk.yellow : chalk.blue;

    console.log(`\n  ${icon} ${color.bold(issue.message)}`);

    if (issue.element) {
      console.log(chalk.gray(`     Element: ${issue.element.substring(0, 80)}${issue.element.length > 80 ? '...' : ''}`));
    }

    if (issue.recommendation) {
      console.log(chalk.gray(`     → ${issue.recommendation}`));
    }
  }
}

export function displayAnalyzers(analyzers: AnalyzerResult[]): void {
  console.log(chalk.bold('\n📋 Detailed Analysis\n'));

  const table = new Table({
    head: [chalk.bold('Analyzer'), chalk.bold('Score'), chalk.bold('Issues')],
    colWidths: [25, 12, 10],
  });

  for (const analyzer of analyzers) {
    const color = getScoreColor(analyzer.score);
    table.push([
      analyzer.name,
      color(`${analyzer.score}/100`),
      analyzer.issues.length.toString(),
    ]);
  }

  console.log(table.toString());
}

export function displayRecommendations(result: AuditResult): void {
  const { recommendations } = result;

  if (recommendations.length === 0) {
    return;
  }

  console.log(chalk.bold('\n💡 Top Recommendations\n'));

  const topRecs = recommendations.slice(0, 5);

  for (let i = 0; i < topRecs.length; i++) {
    const rec = topRecs[i];
    const priorityColor = rec.priority === 'high' ? chalk.red :
                          rec.priority === 'medium' ? chalk.yellow : chalk.blue;

    console.log(`  ${i + 1}. ${chalk.bold(rec.title)} ${priorityColor(`[${rec.priority.toUpperCase()}]`)}`);
    console.log(chalk.gray(`     ${rec.description}`));
    console.log(chalk.gray(`     Category: ${rec.category}`));
    console.log();
  }
}

export function displayFooter(url: string): void {
  console.log(chalk.gray('\n─'.repeat(60)));
  console.log(chalk.gray(`Audit completed for: ${url}`));
  console.log(chalk.gray(`Generated by ClawdBot SEO Auditor`));
  console.log();
}
