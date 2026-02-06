export const APP_NAME = 'cloudflare-ddns';
export const APP_DESCRIPTION = 'Cloudflare Dynamic DNS Client';
export const APP_VERSION = '0.0.5';
export const REPO_NAME = 'huynguyeexn/cloudflare-ddns';

export const ENV_VARS = {
    CONFIG_PATH: 'CLOUDFLARE_DDNS_CONFIG_PATH',
    LOG_PATH: 'CLOUDFLARE_DDNS_LOG_PATH'
};

export const DEFAULT_CONFIG_DIR = '.config/cloudflare-ddns';
export const DEFAULT_CONFIG_FILE = 'config.json';
export const DEFAULT_LOG_FILE = 'app.log';
export const DEFAULT_INTERVAL = 300;
export const DEFAULT_NTFY_URL = 'https://ntfy.sh';

export const IP_SOURCES = {
    V4: [
        'https://ip4.ip8.com/',
        'https://4.tnedi.me',
        'https://api.ipify.org',
        'https://checkip.amazonaws.com',
        'https://ipinfo.io/ip',
        'https://ipv4.icanhazip.com/',
        'https://ipv4.seeip.org',
        'https://v4.ident.me/'
    ],
    V6: [
        'https://ip6.ip8.com/',
        'https://6.tnedi.me',
        'https://api64.ipify.org/',
        'https://ipv6.icanhazip.com/',
        'https://ipv6.seeip.org',
        'https://v6.ident.me/',
        'https://v6.ipinfo.io/ip'
    ]
};

export const IP_REGEX = {
    V4: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
    V6: /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/i
};
