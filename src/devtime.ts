import * as vscode from "vscode";

import { deleteConfig, getConfig, getConfigFilePath, isAuthenticated, sendHeartbeat, setApiUrl, writeConfig } from "./helpers";


function startListeningForEvents(): void {
  vscode.window.onDidChangeTextEditorSelection(selectionChangeHandler);
  vscode.workspace.onDidSaveTextDocument(textDocumentEventHandler);
  console.log('Started listening for events');
}

function textDocumentEventHandler(e: vscode.TextDocument): void {
  let language = e.languageId;
  sendHeartbeat(language);
  console.log('Sent heartbeat!');
};

function selectionChangeHandler(e: vscode.TextEditorSelectionChangeEvent): void {
  let language = e.textEditor.document.languageId;
  sendHeartbeat(language);
  console.log('Sent heartbeat!');
}

// this initializes devtime with setup (config file, login)
export async function initialize(): Promise<void> {
  // TODO: Allow more customization in terms of config

  if (isAuthenticated()) {
    startListeningForEvents();
    return;
  } else {
    let loggedIn = await login();

    // do nothing if not logged in
    if (!loggedIn) { 
      console.log("User didn't login");
      return;
    }

    // if logged in, start listening for events that trigger heartbeats
    startListeningForEvents();
  }
}

// this handles the part of adding the api-key to our config file
export async function login(): Promise<boolean> {
  // For now let's just take API key from a prompt
  // but in the future we want this flow to be easier. Better UX

  const value = await vscode.window
    .showInputBox({
      prompt:
        "Type in your DevTime API key... (You can copy/paste it from https://devtime.tech/profile)",
    });

  if (value === undefined) {
    // do nothing
    return false;
  } else {
    let config = getConfig();
    config["apiKey"] = value;
    writeConfig(config);
    return true;
  }
}

export function showConfig(): void {
  let configFp = getConfigFilePath();
  vscode.window.showTextDocument(vscode.Uri.file(configFp));
}

export function resetConfig(): void {
  deleteConfig();  // deletes config file
  getConfig();  // recreates config file with default value

  vscode.window.showInformationMessage("DevTime: Configuration has been reset to default!");
}

export async function configureApiUrl(): Promise<void> {
  let newUrl: string | undefined = await vscode.window.showInputBox({ prompt: 'Type in backend URL you want to use. (e.g. http://localhost:8000)' });
  if (newUrl) {
    setApiUrl(newUrl);
    vscode.window.showInformationMessage(`API URL set to ${newUrl}`);
  }
}
