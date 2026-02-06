import { Command } from 'commander';
import { setupCommand } from './commands/setup.js';
import { startCommand } from './commands/start.js';
import { statusCommand } from './commands/status.js';
import { serviceCommand } from './commands/service.js';
import { testNotiCommand } from './commands/test-noti.js';
import { logsCommand } from './commands/logs.js';

import { ConfigService } from './services/config.service.js';
import chalk from 'chalk';

const program = new Command();

program.name('cfddns').description('Cloudflare Dynamic DNS Client').version('1.0.0');

program.command('setup').description('Run interactive wizard to configure the client').action(setupCommand);

program.command('start').description('Start the DDNS check loop (foreground)').action(startCommand);

program.command('status').description('Show current status').action(statusCommand);

program
    .command('service')
    .description('Manage background service (Systemd/Launchd)')
    .argument('[action]', 'install | uninstall | start | stop | restart')
    .action((action, _options, command) => {
        if (!action) {
            command.help();
        }
        const allowed = ['install', 'uninstall', 'start', 'stop', 'restart'];
        if (!allowed.includes(action)) {
            console.error(chalk.red(`Invalid action: "${action}"`));
            console.log(`Allowed actions: ${allowed.join(', ')}`);
            process.exit(1);
        }
        serviceCommand(action as any);
    });

program
    .command('config')
    .description('Show current config')
    .action(async () => {
        const cs = new ConfigService();
        const config = await cs.load();
        if (config) {
            console.log(JSON.stringify(config, null, 2));
        } else {
            console.log(chalk.red('No config found. Run "setup" first.'));
        }
    });

program
    .command('test-noti')
    .description('Send a test notification')
    .action(testNotiCommand);

program
    .command('logs')
    .description('View application logs')
    .option('-n, --lines <number>', 'Number of lines to show', '20')
    .option('-f, --follow', 'Follow log output')
    .action(logsCommand);

program.parse();
