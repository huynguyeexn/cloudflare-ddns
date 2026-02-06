import { Command } from 'commander';
import { setupCommand } from './commands/setup.js';
import { startCommand } from './commands/start.js';
import { statusCommand } from './commands/status.js';
import { serviceCommand } from './commands/service.js';
import { testNotiCommand } from './commands/test-noti.js';
import { logsCommand } from './commands/logs.js';
import { updateCommand } from './commands/update.js';
import { selfUpdateCommand } from './commands/self-update.js';

import { ConfigService } from './services/config.service.js';
import chalk from 'chalk';
import { APP_NAME, APP_DESCRIPTION, APP_VERSION } from './constants.js';

const program = new Command();

program.name(APP_NAME).description(APP_DESCRIPTION).version(APP_VERSION);

program.command('setup').description('Run interactive wizard to configure the client').action(setupCommand);

const runGroup = program.command('run').description('Start the DDNS check loop (foreground)').action(startCommand);

runGroup
    .command('now')
    .description('Manually trigger Cloudflare record updates once')
    .action(() => updateCommand({ force: true }));

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
        serviceCommand(action as 'install' | 'uninstall' | 'start' | 'stop' | 'restart');
    });

program
    .command('config')
    .description('Show current config')
    .action(async () => {
        const cs = new ConfigService();
        const config = await cs.loadOrExit();
        console.log(JSON.stringify(config, null, 2));
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

program
    .command('self-update')
    .alias('check-update')
    .description('Check for updates and update the binary')
    .option('--check', 'Only check for updates without downloading')
    .action((options) => selfUpdateCommand({ checkOnly: options.check }));



program.parse();
