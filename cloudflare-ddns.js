const IP_QUERY_APIS = [
  "https://api.ipify.org",
  "https://checkip.amazonaws.com",
  "https://v4.ident.me/",
  "https://ifconfig.me/ip",
  "https://ipv4.icanhazip.com/",
];

const CLOUDFLARE_ZONE_QUERY_API = "https://api.cloudflare.com/client/v4/zones"; // GET
const CLOUDFLARE_ZONE_TOKEN_VERIFY =
  "https://api.cloudflare.com/client/v4/user/tokens/verify"; // GET
const CLOUDFLARE_ZONE_DNS_RECORDS_QUERY_API =
  "https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records"; // GET
const CLOUDFLARE_ZONE_DNS_RECORDS_UPDATE_API =
  "https://api.cloudflare.com/client/v4/zones/{zone_id}/dns_records/{dns_record_id}"; // PATCH

const logging = (messages) => {
  console.log(`${new Date().toJSON()} [Cloudflare DDNS]:`, ...messages);
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
      return false;
    }

    const { status } = (await response.json()).result;

    if (status !== "active") {
      return false;
    }

    return true;
  } catch (error) {
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
      logging(["Cannot get Zone ID. Please check and try again. ", error]);
      return false;
    }

    const allZone = await response.json();
    const zoneIds =
      allZone?.result.filter((zone) => {
        return process.env.RECORDS_NAME.includes(zone.name);
      }) || [];

    return zoneIds.map((zone) => zone.id);
  } catch (error) {
    logging([
      "!!! ERROR !!! - Something wrong when fetch to get Zone ID. ",
      error,
    ]);
    return;
  }
};

const updateLatestIpv4ToEnv = async (ip) => {
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

    Bun.write(".env", newText);
    return;
  } catch (error) {
    logging([
      "!!! ERROR !!! - Something wrong when update latest ip env. ",
      error,
    ]);
    return;
  }
};

const getIpV4 = async () => {
  const promise = Promise.all(
    IP_QUERY_APIS.map(async (endpoint) => {
      const response = await fetch(endpoint);

      if (!response.ok) {
        return;
      }
      const ipv4Regex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
      const responseIp = (await response.text()).match(ipv4Regex);

      return responseIp ? responseIp[0] : responseIp;
    })
  );

  const result = (await promise).filter((x) => x);

  if (result.length < 1) {
    logging(
      "All checked services did not return any ip address. Please check your internet connection. "
    );
    return;
  }

  return result[0];
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
          logging([
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
    logging(["!!! ERROR !!! - Something wrong when get DNS Records. ", error]);
    return;
  }
};

const getUpdateRecords = async (records, ipv4) => {
  try {
    const promise = Promise.all(
      records.map(async (record) => {
        if (!process.env.RECORDS_NAME.includes(record.name)) return;

        const url = CLOUDFLARE_ZONE_DNS_RECORDS_UPDATE_API.replace(
          "{zone_id}",
          record.zone_id
        ).replace("{dns_record_id}", record.id);

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.API_TOKEN}`,
          },
          method: "PUT",
          body: JSON.stringify({ ...record, content: ipv4 }),
        });

        if (!response.ok) {
          return false;
        }

        const { result, success } = await response.json();

        return {
          name: result.name,
          type: result.type,
          success,
        };
      })
    );

    const result = await promise;

    logging([
      `DNS record updated successfully with new ip <${ipv4}>`,
      JSON.stringify(result),
    ]);
    return;
  } catch (error) {
    logging(["!!! ERROR !!! - Something wrong when update records. ", error]);
    return;
  }
};

const checkValidIpV4 = (ipv4) => {
  if (ipv4 && (typeof ipv4 === "string" || ipv4 instanceof String)) {
    if (ipv4 !== process.env.LATEST_IPV4) {
      return true;
    }
    logging(["There is no change of IP"]);
  } else {
    logging(["checkValidIpV4 value invalid, value:", ipv4]);
  }

  return false;
};

const main = async () => {
  const isValid = await verifyToken();
  if (!isValid) {
    logging(["!!! Token invalid !!!! - Please check your token."]);
    return;
  }

  const ipv4 = await getIpV4();
  if (checkValidIpV4(ipv4)) {
    updateLatestIpv4ToEnv(ipv4);
    const zoneIDs = await getZoneIds();
    const allRecords = await getAllRecords(zoneIDs);
    await getUpdateRecords(allRecords, ipv4);
  }
  return;
};

main();
