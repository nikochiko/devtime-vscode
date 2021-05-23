import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";
import { URLSearchParams } from "url";

const configFileName = ".devtime.json";
const defaultConfig = JSON.stringify({
  apiUrl: "https://devtime.hyperlog.io/api/heartbeats",
  hyperlogUrl: "https://app.hyperlog.io",
  client: "vscode",
});

function getBaseDir(): string {
  if (os.platform() === "win32") {
    return process.env["USERPROFILE"] as string;
  } else {
    return process.env["HOME"] || "";
  }
}

export function getConfigFilePath(): string {
  return path.join(getBaseDir(), configFileName);
}

// get config from file as a Record
export function getConfig(): Record<string, any> {
  let configFilePath = getConfigFilePath();
  if (!fs.existsSync(configFilePath)) {
    fs.writeFileSync(configFilePath, defaultConfig);
  }

  return JSON.parse(fs.readFileSync(configFilePath).toString());
}

// write new config to file
export function writeConfig(newConfig: Record<string, any>): void {
  let configFilePath = getConfigFilePath();

  fs.writeFileSync(configFilePath, JSON.stringify(newConfig));
}

// delete config file
export function deleteConfig(): void {
  let configFilePath = getConfigFilePath();

  fs.unlinkSync(configFilePath);
}

export function isAuthenticated(): boolean {
  return "apiKey" in getConfig();
}

export function sendHeartbeat(
  language: string | undefined,
  timestamp: number | undefined
): void {
  let config: Record<string, any> = getConfig();

  let body = {
    language: language || null,
    recorded_at: new Date(timestamp || Date.now()).toISOString(),
    client: config.client,
  };
  fetch(config.apiUrl, {
    method: "POST",
    headers: {
      "X-API-KEY": config.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Heartbeat sent successfully!");
      } else {
        response
          .text()
          .then((body) =>
            console.error(
              `Unable to send heartbeat. Status: ${response.status}. Response: ${body}`
            )
          );
      }
    })
    .catch((reason) => {
      console.log(JSON.stringify(reason));
    });
}

export function generateToken(): string {
  return b64encode(uuidv4());
}

export function getLoginUrl(token: string): string {
  let config: Record<string, any> = getConfig();

  return `${config.hyperlogUrl}/devtime/auth/login?` + new URLSearchParams({ token });
}

export async function pollAuthToken(token: string): Promise<Record<string, any>> {
  let config: Record<string, any> = getConfig();

  let url =
    `${config.hyperlogUrl}/devtime/auth/verify?` +
    new URLSearchParams({ token });

  const startDate = Date.now();

  // poll for 2 minutes
  while (Date.now() - startDate < 120000) {
    let response = await fetch(url);
    if (!response.ok) {
      let resp = await response.json();
      return { ok: false, message: resp.message };
    }
    if (response.status === 200) {
      let resp = await response.json();
      console.log('Login successful');
      return { ok: true, apiKey: resp['api_key'] };
    } else {  // response.status == 202
      let resp = await response.json();
      console.log(`Got status code ${response.status}. Message: ${resp.message}`);

      // sleep for 2 seconds
      await sleep(2000);
    }
  }

  return { ok: false, message: "Login timed out after 2 minutes" };
}  

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function b64encode(str: string): string {
  return Buffer.from(str).toString('base64');
}
