import { Logger } from '../utils/logger.js';
import { fetchWithTimeout } from '../utils/http.js';
import { IP_SOURCES, IP_REGEX } from '../constants.js';

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
        const ip = await this.getIpFromSources(IP_SOURCES.V4, IP_REGEX.V4);
        if (!ip) {
            Logger.error('Failed to fetch IPv4 address from all sources.');
        }
        return ip;
    }

    static async getIpV6(): Promise<string | null> {
        const ip = await this.getIpFromSources(IP_SOURCES.V6, IP_REGEX.V6);
        if (!ip) {
            Logger.warning('Failed to fetch IPv6 address from all sources.');
        }
        return ip;
    }
}
