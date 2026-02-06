import chalk from 'chalk';
import { fetchWithTimeout } from '../src/utils/http.js';
import { GET_IPV4_APIS, GET_IPV6_APIS, REGEX_IPV4ADDR, REGEX_IPV6ADDR } from '../src/services/ip.service.js';

async function checkUrl(url: string, regex: RegExp) {
    try {
        const start = Date.now();
        const res = await fetchWithTimeout(url, { timeout: 5000 });
        const duration = Date.now() - start;

        if (!res.ok) {
            return `${chalk.red('✘')} ${url.padEnd(30)} ${chalk.red(`Error: ${res.status}`)}`;
        }
        const text = (await res.text()).trim();
        if (regex.test(text)) {
            return `${chalk.green('✔')} ${url.padEnd(30)} ${chalk.green(text)} (${duration}ms)`;
        } else {
            return `${chalk.yellow('⚠')} ${url.padEnd(30)} ${chalk.yellow('Invalid format: ' + text)}`;
        }
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Timeout/Error';
        return `${chalk.red('✘')} ${url.padEnd(30)} ${chalk.red(message)}`;
    }
}

async function checkSources() {
    console.log(chalk.bold('\n🔍 Checking IPv4 Sources...'));
    const ipv4Results = await Promise.all(GET_IPV4_APIS.map(url => checkUrl(url, REGEX_IPV4ADDR)));
    ipv4Results.forEach(res => console.log(res));

    console.log(chalk.bold('\n🔍 Checking IPv6 Sources...'));
    const ipv6Results = await Promise.all(GET_IPV6_APIS.map(url => checkUrl(url, REGEX_IPV6ADDR)));
    ipv6Results.forEach(res => console.log(res));
}

checkSources();
