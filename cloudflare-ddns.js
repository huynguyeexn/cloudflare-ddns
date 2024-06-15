import { appendFile } from "node:fs/promises";

const GET_IPV4_APIS = [
  "https://4.tnedi.me",
  "https://api.ipify.org",
  "https://checkip.amazonaws.com",
  "https://ipinfo.io/ip",
  "https://ipv4.getmyip.dev/",
  "https://ipv4.icanhazip.com/",
  "https://ipv4.seeip.org",
  "https://v4.ident.me/",
];

const GET_IPV6_APIS = [
  "https://6.tnedi.me",
  "https://api64.ipify.org/",
  "https://ipecho.net/plain",
  "https://ipv6.getmyip.dev/",
  "https://ipv6.icanhazip.com/",
  "https://ipv6.seeip.org",
  "https://v6.ident.me/",
  "https://v6.ipinfo.io/ip",
];

const CLOUDFLARE_ZONE_QUERY_API = "https://api.cloudflare.com/client/v4/zones"; // GET
const CLOUDFLARE_ZONE_TOKEN_VERIFY =
  "https://api.cloudflare.com/client/v4/user/tokens/verify"; // GET
const CLOUDFLARE_ZONE_DNS_RECORDS_QUERY_API =
  "https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records"; // GET
const CLOUDFLARE_ZONE_DNS_RECORDS_UPDATE_API =
  "https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{dns_record_id}"; // PATCH

const REGEX_IPV4ADDR =
  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

const REGEX_IPV6ADDR =
  /(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))/gi;

class Logging {
  static type = "INFO"; // "INFO", "ERROR"

  static async print(messages) {
    let output = "";

    const timestamp = new Date().toJSON();
    const fileLogName = `${this.type.toLowerCase()}.log`;

    const setOutput = (msg) => {
      output += `[${timestamp} Cloudflare DDNS ${this.type}] ${JSON.stringify(
        msg
      )}\n`;
    };

    if (Array.isArray(messages)) {
      messages.forEach((msg) => {
        setOutput(msg);
      });
    } else {
      setOutput(messages);
    }

    if (output !== "") {
console.log(output);
      await appendFile(fileLogName, output);
    }
  }

  static info(messages) {
    this.type = "INFO";
    this.print(messages);
  }
  static error(messages) {
    this.type = "ERROR";
    this.print(messages);
  }
}

const fetchTimeout = (url, ms, { signal, ...options } = {}) => {
  const controller = new AbortController();
  const promise = fetch(url, { signal: controller.signal, ...options });
  if (signal) signal.addEventListener("abort", () => controller.abort());
  const timeout = setTimeout(() => controller.abort(), ms);
  return promise.finally(() => clearTimeout(timeout));
};

const verifyToken = async () => {
  try {
    const response = await fetch(CLOUDFLARE_ZONE_TOKEN_VERIFY, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      keepalive: false,
    });

    if (!response.ok) {
      Logging.error(["verifyToken()", response]);
      return false;
    }

    const { status } = (await response.json()).result;
    if (status !== "active") {
      Logging.error(["Token is INACTIVE - Please check your token."]);
      return false;
    }

    return true;
  } catch (error) {
    Logging.error(["Something wrong when verify token. ", error]);
    throw new Error(error);
  }
};

const getZoneIds = async () => {
  try {
    const response = await fetch(CLOUDFLARE_ZONE_QUERY_API, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    });

    if (!response.ok) {
      Logging.info(["Cannot get Zone ID. Please check and try again. ", error]);
      return false;
    }

    const allZone = await response.json();
    const zoneIds =
      allZone?.result.filter((zone) => {
        return process.env.RECORDS_NAME.includes(zone.name);
      }) || [];

    return zoneIds.map((zone) => zone.id);
  } catch (error) {
    Logging.error(["Something wrong when fetch to get Zone ID. ", error]);
    return;
  }
};

const updateLatestIPv4ToEnv = async (ip) => {
  try {
    const text = (await Bun.file(".env").text()).trim();
    let newText = "";

    const regex = /^LATEST_IPV4.*$/m;
    const match = text.match(regex);
    if (match === null) {
      newText = text + "\nLATEST_IPV4=" + ip;
    } else {
      newText = text.replace(regex, "LATEST_IPV4=" + ip);
    }

    await Bun.write(".env", newText);
    return;
  } catch (error) {
    Logging.error(["Something wrong when update latest ip env. ", error]);
    return;
  }
};

const updateLatestIPv6ToEnv = async (ip) => {
  try {
    const text = (await Bun.file(".env").text()).trim();
    let newText = "";

    const regex = /^LATEST_IPV6.*$/m;
    const match = text.match(regex);
    if (match === null) {
      newText = text + "\nLATEST_IPV6=" + ip;
    } else {
      newText = text.replace(regex, "LATEST_IPV6=" + ip);
    }
    await Bun.write(".env", newText);
    return;
  } catch (error) {
    Logging.error(["Something wrong when update latest ip env. ", error]);
    return;
  }
};

const getIpV4 = async () => {
  try {
	 const controller = new AbortController();

    const IPv4 = await Promise.any(
      GET_IPV4_APIS.map(async (endpoint) => {
        try {
          const response = await fetchTimeout(endpoint, 5000);
          if (!response.ok) {
            return;
          }

          const responseText = await response.text();
          if (REGEX_IPV4ADDR.test(responseText)) {
            return Promise.resolve(responseText);
          }
        } catch (error) {
          return Promise.reject(error);
        }

        return Promise.reject();
      })
    );
    return IPv4.trim();
  } catch (error) {
    Logging.error(
      "getIpV4(): All checked services did not return any ip address. Please check your internet connection. "
    );
    return;
  }
};

const getIpV6 = async () => {
  try {
    const IPv6 = await Promise.any(
      GET_IPV6_APIS.map(async (endpoint) => {
        try {
          const response = await fetch(endpoint);

          if (!response.ok) {
            return;
          }

          const responseText = await response.text();
          if (REGEX_IPV6ADDR.test(responseText)) {
            return Promise.resolve(responseText);
          }
        } catch (error) {
          return Promise.reject(error);
        }

        return Promise.reject();
      })
    );
    return IPv6.trim();
  } catch (error) {
    Logging.error(
      "getIpV6(): All checked services did not return any ip address. Please check your internet connection. "
    );
    return;
  }
};

const getAllRecords = async (zoneIds) => {
  try {
    const records = await Promise.all(
      zoneIds.map(async (zoneId) => {
        const url = CLOUDFLARE_ZONE_DNS_RECORDS_QUERY_API.replace(
          "{zone_id}",
          zoneId
        );
        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.API_TOKEN}`,
          },
        });

        if (!response.ok) {
          Logging.info([
            "Cannot get DNS Records. Please check and try again. ",
            error,
          ]);
          return false;
        }

        return (await response.json()).result.filter((record) =>
          ["A", "AAAA"].includes(record.type)
        );
      })
    );

    return records.flat();
  } catch (error) {
    Logging.error(["Something wrong when get DNS Records. ", error]);
    return;
  }
};

const getUpdateRecords = async (records, IPv4, IPv6) => {
  try {
    const promise = Promise.all(
      records.map(async (record) => {
        if (!process.env.RECORDS_NAME.includes(record.name)) return;

        const currentIP = {
          A: IPv4,
          AAAA: IPv6,
        }[record.type];

        const url = CLOUDFLARE_ZONE_DNS_RECORDS_UPDATE_API.replace(
          "{zone_id}",
          record.zone_id
        ).replace("{dns_record_id}", record.id);

        const payload = {
          name: record.name,
          type: record.type,
          content: currentIP,
        };

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.API_TOKEN}`,
          },
          method: "PATCH",
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          Logging.error(
            `getUpdateRecords() - Failed when update record ${JSON.stringify(
              response
            )}`
          );
          return false;
        }
        const { success } = await response.json();

        return { payload, success: success };
      })
    );

    const result = await promise;

    Logging.info([
      `DNS record updated successfully with new IPv4<${IPv4}> - IPv6<${IPv6}>`,
      JSON.stringify(result),
    ]);
    await updateLatestIPv4ToEnv(IPv4);
    await updateLatestIPv6ToEnv(IPv6);
    return;
  } catch (error) {
    Logging.error(["Something wrong when update records. ", error]);
    return;
  }
};

const checkValidIPv4 = (IPv4 = null) => {
  if (IPv4 && (typeof IPv4 === "string" || IPv4 instanceof String)) {
    if (IPv4 !== process.env.LATEST_IPV4) {
      return true;
    }

    if (process.env.LOGGING_WHEN_UNCHANGED_IP_ADDRESS === "true") {
      Logging.info("Unchanged IPv4 address");
    }
  } else {
    Logging.error(["checkValidIPv4(IPv4) - IPv4:", IPv4]);
  }

  return false;
};

const checkValidIPv6 = (IPv6 = null) => {
  if (IPv6 && (typeof IPv6 === "string" || IPv6 instanceof String)) {
    if (IPv6 !== process.env.LATEST_IPV6) {
      return true;
    }

    if (process.env.LOGGING_WHEN_UNCHANGED_IP_ADDRESS === "true") {
      Logging.info("Unchanged IPv6 address");
    }
  } else {
    Logging.error(["checkValidIPv6(IPv6) - IPv6:", IPv6]);
  }

  return false;
};

const main = async () => {
	try {
  const IPv4 = await getIpV4();
  const IPv6 = await getIpV6();
  if (!checkValidIPv4(IPv4) && !checkValidIPv6(IPv6)) return;

  const isValidToken = await verifyToken();
  if (!isValidToken) return;

  const zoneIDs = await getZoneIds();
  const allRecords = await getAllRecords(zoneIDs);
  await getUpdateRecords(allRecords, IPv4, IPv6);
	} catch (e) {
		Logging.error(["main():", e]);
	}
return;
};

main();
