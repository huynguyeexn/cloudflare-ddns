import { Logger } from '../utils/logger.js';

const GET_IPV4_APIS = [
    'https://ip4.ip8.com/',
    'https://4.tnedi.me',
    'https://api.ipify.org',
    'https://checkip.amazonaws.com',
    'https://ipinfo.io/ip',
    'https://ipv4.getmyip.dev/',
    'https://ipv4.icanhazip.com/',
    'https://ipv4.seeip.org',
    'https://v4.ident.me/'
];

const GET_IPV6_APIS = [
    'https://ip6.ip8.com/',
    'https://6.tnedi.me',
    'https://api64.ipify.org/',
    'https://ipecho.net/plain',
    'https://ipv6.getmyip.dev/',
    'https://ipv6.icanhazip.com/',
    'https://ipv6.seeip.org',
    'https://v6.ident.me/',
    'https://v6.ipinfo.io/ip'
];

const REGEX_IPV4ADDR =
    /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const REGEX_IPV6ADDR =
    /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/gi;

export class IpService {
    private static fetchTimeout(url: string, ms: number): Promise<Response> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), ms);
        return fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
    }

    static async getIpV4(): Promise<string | null> {
        try {
            const ipv4 = await Promise.any(
                GET_IPV4_APIS.map(async (endpoint) => {
                    try {
                        const response = await this.fetchTimeout(endpoint, 2000);
                        if (!response.ok) throw new Error('Network response was not ok');
                        const text = await response.text();
                        if (REGEX_IPV4ADDR.test(text.trim())) {
                            return text.trim();
                        }
                        throw new Error('Invalid IPv4 response');
                    } catch (e) {
                        return Promise.reject(e);
                    }
                })
            );
            return ipv4;
        } catch (_error) {
            Logger.error('Failed to fetch IPv4 address from all sources.');
            return null;
        }
    }

    static async getIpV6(): Promise<string | null> {
        try {
            const ipv6 = await Promise.any(
                GET_IPV6_APIS.map(async (endpoint) => {
                    try {
                        const response = await this.fetchTimeout(endpoint, 2000);
                        if (!response.ok) throw new Error('Network response was not ok');
                        const text = await response.text();
                        if (REGEX_IPV6ADDR.test(text.trim())) {
                            return text.trim();
                        }
                        throw new Error('Invalid IPv6 response');
                    } catch (e) {
                        return Promise.reject(e);
                    }
                })
            );
            return ipv6;
        } catch (_error) {
            // IPv6 is often unavailable, so just warn
            Logger.warning('Failed to fetch IPv6 address from all sources.');
            return null;
        }
    }
}
