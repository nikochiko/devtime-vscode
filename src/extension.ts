import * as vscode from "vscode";

import { Devtime } from "./devtime";

export async function activate(context: vscode.ExtensionContext) {
  const devtime = new Devtime();
  console.log("DevTime is now active!");

  await devtime.initialize();
  console.log("Initialization complete!");

  let ping = vscode.commands.registerCommand("devtime.ping", () => {
    vscode.window.showInformationMessage("pong!");
  });
  context.subscriptions.push(ping);

  context.subscriptions.push(
    vscode.commands.registerCommand("devtime.login", devtime.login, devtime)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devtime.showConfig", devtime.showConfig, devtime)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devtime.resetConfig", devtime.resetConfig, devtime)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devtime.setup", devtime.initialize, devtime)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("devtime.logout", devtime.logout, devtime)
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "devtime.configureApiUrl",
      devtime.configureApiUrl,
      devtime
    ),
  );
}

// this method is called when your extension is deactivated
export function deactivate() {
  console.log("DevTime disabled now!");
}
