import * as vscode from "vscode";

import { configureApiUrl, initialize, login, resetConfig, showConfig } from "./devtime";

export async function activate(context: vscode.ExtensionContext) {
  console.log("DevTime is now active!");

	await initialize();
	console.log('Initialization complete!');

  let ping = vscode.commands.registerCommand("devtime.ping", () => {
    vscode.window.showInformationMessage("pong!");
  });
  context.subscriptions.push(ping);

  context.subscriptions.push(
    vscode.commands.registerCommand("devtime.login", login)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devtime.showConfig", showConfig)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devtime.resetConfig", resetConfig)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devtime.setup", initialize)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devtime.configureApiUrl", configureApiUrl)
  );
}

// this method is called when your extension is deactivated
export function deactivate() {
	console.log('DevTime disabled now!');
}
