import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConfigService, type Config } from '../services/config.service.js';
import { CloudflareService } from '../services/cloudflare.service.js';
import { DEFAULT_INTERVAL, DEFAULT_NTFY_URL } from '../constants.js';

export async function setupCommand() {
    console.log(chalk.blue.bold('Cloudflare DDNS Setup Wizard'));
    console.log(chalk.gray('This wizard will help you configure your API Token and Records.'));

    const configService = new ConfigService();
    const currentConfig = await configService.load();

    const questions = [
        {
            type: 'input',
            name: 'apiToken',
            message: 'Enter your Cloudflare API Token:',
            default: currentConfig?.apiToken,
            validate: (input: string) => (input.length > 0 ? true : 'API Token is required')
        }
    ];

    const answers = await inquirer.prompt(questions);
    const apiToken = answers.apiToken;

    const cfService = new CloudflareService(apiToken);
    console.log(chalk.yellow('Verifying token...'));

    const isValid = await cfService.verifyToken();
    if (!isValid) {
        console.error(chalk.red('Invalid API Token or Token is not active. Please check permissions (Zone.DNS:Edit).'));
        return;
    }
    console.log(chalk.green('Token verified!'));

    console.log(chalk.yellow('Fetching zones...'));
    const zones = await cfService.getZones();

    if (zones.length === 0) {
        console.error(chalk.red('No zones found for this token.'));
        return;
    }

    // Ask user to select zones first to filter records?
    // Or just fetch all records? Fetching all records might be slow if many zones.
    // Let's ask user to select Zones.

    const zoneChoices = zones.map((z) => ({ name: z.name, value: z.id }));

    const { selectedZones } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'selectedZones',
            message: 'Select the Zones (Domains) you want to manage:',
            choices: zoneChoices,
            validate: (input) => (input.length > 0 ? true : 'Choose at least one zone')
        }
    ]);

    console.log(chalk.yellow('Fetching DNS records...'));

    let allRecords: Array<{ name: string; type: string; content: string }> = [];
    for (const zoneId of selectedZones) {
        const records = await cfService.getRecords(zoneId);
        allRecords = [...allRecords, ...records];
    }

    if (allRecords.length === 0) {
        console.error(chalk.red('No A/AAAA records found in selected zones.'));
        return;
    }

    /* const recordChoices = allRecords.map(r => ({
        name: `${r.name} (${r.type}) - ${r.content}`,
        value: r.name
    })); */

    // Unique names only for config, but user might want to select specific types?
    // The current logic simply updates A and AAAA for a given name.
    // So we just need the list of Hostnames.

    const uniqueNames = [...new Set(allRecords.map((r) => r.name))];

    const { selectedRecords, interval, enableIpv4, enableIpv6 } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'selectedRecords',
            message: 'Select the DNS Records (subdomains) to update automatically:',
            choices: uniqueNames,
            default: currentConfig?.records,
            validate: (input: string[]) => (input.length > 0 ? true : 'Choose at least one record')
        },
        {
            type: 'input',
            name: 'interval',
            message: 'Check interval in seconds (>= 10):',
            default: currentConfig?.interval ? String(currentConfig.interval) : String(DEFAULT_INTERVAL),
            validate: (value: string) => {
                const parsed = parseInt(value, 10);
                return !isNaN(parsed) && parsed >= 10 ? true : 'Interval must be a number >= 10';
            },
            filter: (value: string) => parseInt(value, 10)
        },
        {
            type: 'confirm',
            name: 'enableIpv4',
            message: 'Enable IPv4 (A records)?',
            default: currentConfig?.enableIpv4 !== undefined ? currentConfig.enableIpv4 : true
        },
        {
            type: 'confirm',
            name: 'enableIpv6',
            message: 'Enable IPv6 (AAAA records)?',
            default: currentConfig?.enableIpv6 !== undefined ? currentConfig.enableIpv6 : true
        }
    ]);

    // Notification Setup
    const { enableNotifications } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'enableNotifications',
            message: 'Do you want to enable notifications (NTFY)?',
            default: currentConfig?.notifications?.enabled || false
        }
    ]);

    let notificationConfig;

    if (enableNotifications) {
        const ntfyConfig = await inquirer.prompt([
            {
                type: 'input',
                name: 'url',
                message: `NTFY Server URL (default: ${DEFAULT_NTFY_URL}):`,
                default: currentConfig?.notifications?.ntfy?.url || DEFAULT_NTFY_URL
            },
            {
                type: 'input',
                name: 'topic',
                message: 'NTFY Topic Name:',
                default: currentConfig?.notifications?.ntfy?.topic,
                validate: (input) => (input.length > 0 ? true : 'Topic is required')
            },
            {
                type: 'input',
                name: 'token',
                message: 'NTFY Access Token (optional, for private topics):',
                default: currentConfig?.notifications?.ntfy?.token
            }
        ]);

        notificationConfig = {
            enabled: true,
            provider: 'ntfy' as const,
            ntfy: {
                url: ntfyConfig.url,
                topic: ntfyConfig.topic,
                token: ntfyConfig.token || undefined
            }
        };
    }

    const config: Config = {
        apiToken,
        records: selectedRecords,
        interval: interval,
        enableIpv4,
        enableIpv6,
        notifications: notificationConfig
    };

    await configService.save(config);

    console.log(chalk.green(`Configuration saved to ${configService.getPath()}`));
    console.log(chalk.blue('You can now run "cloudflare-ddns run" or "cloudflare-ddns service install"'));
}
