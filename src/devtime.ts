import * as vscode from "vscode";

import {
  deleteConfig,
  getConfig,
  getConfigFilePath,
  isAuthenticated,
  sendHeartbeat,
  writeConfig,
} from "./helpers";

interface Config {
  apiKey: string;
  apiUrl: string;
  client: string;
  heartbeatDuration: number; // in milliseconds
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
    // For now let's just take API key from a prompt
    // but in the future we want this flow to be easier. Better UX

    const value = await vscode.window.showInputBox({
      prompt:
        "Type in your DevTime API key... (You can copy/paste it from https://devtime.tech/profile)",
    });

    if (value === undefined) {
      return false;
    } else {
      this.setApiKey(value);
      return true;
    }
  }

  showConfig(): void {
    let configFp = getConfigFilePath();
    vscode.window.showTextDocument(vscode.Uri.file(configFp));
  }

  resetConfig(): void {
    deleteConfig(); // deletes config file
    getConfig(); // recreates config file with default value

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
