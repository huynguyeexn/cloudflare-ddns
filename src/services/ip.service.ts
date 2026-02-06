import { Logger } from '../utils/logger.js';
import { fetchWithTimeout } from '../utils/http.js';

export const GET_IPV4_APIS = [
    'https://ip4.ip8.com/',
    'https://4.tnedi.me',
    'https://api.ipify.org',
    'https://checkip.amazonaws.com',
    'https://ipinfo.io/ip',
    'https://ipv4.icanhazip.com/',
    'https://ipv4.seeip.org',
    'https://v4.ident.me/'
];

export const GET_IPV6_APIS = [
    'https://ip6.ip8.com/',
    'https://6.tnedi.me',
    'https://api64.ipify.org/',
    'https://ipv6.icanhazip.com/',
    'https://ipv6.seeip.org',
    'https://v6.ident.me/',
    'https://v6.ipinfo.io/ip'
];

export const REGEX_IPV4ADDR =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

export const REGEX_IPV6ADDR =
    /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/i;

export class IpService {
    private static async getIpFromSources(sources: string[], regex: RegExp): Promise<string | null> {
        try {
            return await Promise.any(
                sources.map(async (endpoint) => {
                    try {
                        const response = await fetchWithTimeout(endpoint, { timeout: 3000 });
                        if (!response.ok) throw new Error(`Status ${response.status}`);
                        const text = (await response.text()).trim();
                        if (regex.test(text)) return text;
                        throw new Error('Invalid format');
                    } catch (e) {
                        return Promise.reject(e);
                    }
                })
            );
        } catch {
            return null;
        }
    }

    static async getIpV4(): Promise<string | null> {
        const ip = await this.getIpFromSources(GET_IPV4_APIS, REGEX_IPV4ADDR);
        if (!ip) {
            Logger.error('Failed to fetch IPv4 address from all sources.');
        }
        return ip;
    }

    static async getIpV6(): Promise<string | null> {
        const ip = await this.getIpFromSources(GET_IPV6_APIS, REGEX_IPV6ADDR);
        if (!ip) {
            Logger.warning('Failed to fetch IPv6 address from all sources.');
        }
        return ip;
    }
}
