#!/usr/bin/env node

import { Command } from 'commander';
import { createAuditCommand } from './commands/audit.js';
import { createPageCommand } from './commands/page.js';
import { runInteractiveMode } from './commands/interactive.js';

const program = new Command();

program
  .name('clawdbot')
  .description('AI-Powered SEO Auditor')
  .version('1.0.0');

// Add commands
program.addCommand(createAuditCommand());
program.addCommand(createPageCommand());

// Default action (no command) - run interactive mode
program.action(async () => {
  await runInteractiveMode();
});

program.parse();
