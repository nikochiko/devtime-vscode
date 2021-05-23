import * as vscode from "vscode";

import {
  deleteConfig,
  getConfig,
  getConfigFilePath,
  isAuthenticated,
  sendHeartbeat,
  writeConfig,
  pollAuthToken,
  generateToken,
  getLoginUrl
} from "./helpers";

interface Config {
  apiUrl: string;
  hyperlogUrl: string;
  client: string;
  apiKey?: string;
  heartbeatDuration?: number; // in milliseconds
}

export class Devtime {
  private config = getConfig() as Config;
  private lastHeartbeatAt: number | undefined;
  private heartbeatDuration: number = this.config.heartbeatDuration || 30000; // 30 seconds

  private setApiKey(key: string) {
    this.config.apiKey = key;
    writeConfig(this.config);
  }

  private setApiUrl(url: string) {
    this.config.apiUrl = url;
    writeConfig(this.config);
  }

  private startListeningForEvents(): void {
    vscode.window.onDidChangeTextEditorSelection(this.selectionChangeHandler, this);
    vscode.workspace.onDidSaveTextDocument(this.textDocumentEventHandler, this);
    console.log("Started listening for events");
  }

  private sendHeartbeatIfOk(activeDoc: vscode.TextDocument): void {
    let now = Date.now();
    if (
      !this.lastHeartbeatAt ||
      now > this.lastHeartbeatAt + this.heartbeatDuration
    ) {
      let language = activeDoc.languageId;
      sendHeartbeat(language, now);
      this.lastHeartbeatAt = now;
      console.log("Sent heartbeat!");
    } else {
      console.log(`Not sending heartbeat because for some reason. lastHeartbeatAt: ${this.lastHeartbeatAt}. duration: ${this.heartbeatDuration}. now: ${now}`);
    }
  }

  private textDocumentEventHandler(e: vscode.TextDocument): void {
    this.sendHeartbeatIfOk(e);
  }

  private selectionChangeHandler(
    e: vscode.TextEditorSelectionChangeEvent
  ): void {
    this.sendHeartbeatIfOk(e.textEditor.document);
  }

  // this initializes devtime with setup (config file, login)
  async initialize(): Promise<void> {
    // TODO: Allow more customization in terms of config

    if (!isAuthenticated()) {
      let loggedIn = await this.login();

      // do nothing if not logged in
      if (!loggedIn) {
        console.log("User didn't login");
        return;
      }
    }

    // if logged in, start listening for events that trigger heartbeats
    this.startListeningForEvents();
  }

  // this handles the part of adding the api-key to our config file
  async login(): Promise<boolean> {
    const token = generateToken();
    console.log(`Generated token: ${token}`);
    const loginUrl = getLoginUrl(token);
    const message = `Opening browser. Please confirm your DevTime login with Hyperlog`;
  
    vscode.env.openExternal(vscode.Uri.parse(loginUrl)).then(value => {
      if (value) {
        vscode.window.showInformationMessage(message);
      } else {
        vscode.window.showErrorMessage(`Unable to open browser window. Please go to ${loginUrl} and confirm your login`);
      }
    });
    const response = await pollAuthToken(token);

    if (response.ok === true) {
      const { apiKey } = response;
      vscode.window.showInformationMessage("Logged into DevTime!");
      this.setApiKey(apiKey);
      return true;
    } else {
      vscode.window.showErrorMessage(response.message);
      return false;
    }
  }

  async logout(): Promise<void> {
    delete this.config.apiKey;
    writeConfig(this.config);

    vscode.window.showInformationMessage("Logout Successful!");
  }

  showConfig(): void {
    let configFp = getConfigFilePath();
    vscode.window.showTextDocument(vscode.Uri.file(configFp));
  }

  resetConfig(): void {
    deleteConfig(); // deletes config file
    this.config = getConfig() as Config; // recreates config file with default value

    vscode.window.showInformationMessage(
      "DevTime: Configuration has been reset to default!"
    );
  }

  async configureApiUrl(): Promise<void> {
    let newUrl: string | undefined = await vscode.window.showInputBox({
      prompt:
        "Type in backend URL you want to use. (e.g. http://localhost:8000)",
    });
    if (newUrl) {
      this.setApiUrl(newUrl);
      vscode.window.showInformationMessage(`API url set to ${newUrl}`);
    }
  }
}
