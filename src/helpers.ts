import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import fetch from "node-fetch";

const configFileName = ".devtime.json";
const defaultConfig = JSON.stringify({
  apiUrl: "https://devtime.tech/api/heartbeats",
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

export function sendHeartbeat(language: string | undefined): void {
  let url: string = getConfig().apiUrl;

  let body = {
    language: language || null,
    recorded_at: new Date(Date.now()).toISOString(),
  };
  fetch(url, {
    method: "POST",
    headers: { 'X-API-KEY': getConfig().apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  .then(response => {
    if (response.ok) {
      console.log('Heartbeat sent successfully!');
    } else {
      response.text()
        .then(body => console.error(`Unable to send heartbeat. Status: ${response.status}. Response: ${body}`));
    }
  })
  .catch(reason => {
    console.log(JSON.stringify(reason));
  });
}

export function setApiUrl(url: string): void {
  let config = getConfig();
  config['apiUrl'] = url;
  writeConfig(config);
}