import { Logger } from '../utils/logger.js';
import { fetchWithTimeout } from '../utils/http.js';

interface CloudflareResponse<T> {
    success: boolean;
    errors: { code: number; message: string }[];
    messages: string[];
    result: T;
}

interface CloudflareZone {
    id: string;
    name: string;
    status: string;
}

export interface CloudflareRecord {
    id: string;
    zone_id: string;
    name: string;
    type: 'A' | 'AAAA';
    content: string;
    proxied: boolean;
}

export class CloudflareService {
    private apiToken: string;
    private baseUrl = 'https://api.cloudflare.com/client/v4';

    constructor(apiToken: string) {
        this.apiToken = apiToken;
    }

    private async request<T>(endpoint: string, method: string = 'GET', body?: unknown): Promise<CloudflareResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiToken}`
        };

        const response = await fetchWithTimeout(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            timeout: 10000
        });

        const data = (await response.json()) as CloudflareResponse<T>;
        if (!response.ok || !data.success) {
            throw new Error(data.errors?.[0]?.message || 'Unknown Cloudflare Error');
        }
        return data;
    }

    async verifyToken(): Promise<boolean> {
        try {
            const data = await this.request<{ status: string }>('/user/tokens/verify');
            return data.result.status === 'active';
        } catch (error) {
            Logger.error('Token verification failed:', error);
            return false;
        }
    }

    async getZones(): Promise<CloudflareZone[]> {
        try {
            const data = await this.request<CloudflareZone[]>('/zones');
            return data.result.map((z) => ({
                id: z.id,
                name: z.name,
                status: z.status
            }));
        } catch (error) {
            Logger.error('Failed to get zones:', error);
            return [];
        }
    }

    async getRecords(zoneId: string): Promise<CloudflareRecord[]> {
        try {
            // API returns a list of records mixed with other types, but we filter them.
            // We can type the result strictly.
            const data = await this.request<CloudflareRecord[]>(`/zones/${zoneId}/dns_records`);
            return data.result
                .filter((r) => ['A', 'AAAA'].includes(r.type))
                .map((r) => ({
                    id: r.id,
                    zone_id: zoneId,
                    name: r.name,
                    type: r.type,
                    content: r.content,
                    proxied: r.proxied
                }));
        } catch (error) {
            Logger.error(`Failed to get records for zone ${zoneId}:`, error);
            return [];
        }
    }

    async updateRecord(record: CloudflareRecord, newIp: string): Promise<boolean> {
        try {
            const endpoint = `/zones/${record.zone_id}/dns_records/${record.id}`;
            await this.request(endpoint, 'PATCH', {
                content: newIp
            });
            return true;
        } catch (error) {
            Logger.error(`Failed to update record ${record.name} (${record.type}):`, error);
            return false;
        }
    }
}
