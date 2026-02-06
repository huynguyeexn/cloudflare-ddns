import inquirer from 'inquirer';
import chalk from 'chalk';
import { ConfigService, type Config } from '../services/config.service.js';
import { CloudflareService } from '../services/cloudflare.service.js';


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

    const { selectedRecords, interval } = await inquirer.prompt([
        {
            type: 'checkbox',
            name: 'selectedRecords',
            message: 'Select the DNS Records (subdomains) to update automatically:',
            choices: uniqueNames,
            validate: (input) => (input.length > 0 ? true : 'Choose at least one record')
        },
        {
            type: 'input',
            name: 'interval',
            message: 'Check interval in seconds (>= 10):',
            default: '300',
            validate: (value) => {
                const parsed = parseInt(value, 10);
                return !isNaN(parsed) && parsed >= 10 ? true : 'Interval must be a number >= 10';
            },
            filter: (value) => parseInt(value, 10)
        }
    ]);

    const config: Config = {
        apiToken,
        records: selectedRecords,
        interval: interval
    };

    await configService.save(config);

    console.log(chalk.green(`Configuration saved to ${configService.getPath()}`));
    console.log(chalk.blue('You can now run "cfddns start" or "cfddns service install"'));
}
