// @ts-check
const path = require("node:path");
const vscode = require("vscode");
const vsclient = require("vscode-languageclient/node");

const { Logger } = require("./logger.js");

/** @param {vscode.ExtensionContext}  context */
function activate(context) {
	const logger = new Logger("learn-lsp");
	const client = new vsclient.LanguageClient(
		"learn-lsp",
		"Learn LSP",
		{
			run: {
				command: "deno",
				args: ["run", "-A", path.resolve(__dirname, "../../server.ts")],
				transport: vsclient.TransportKind.stdio,
			},
			debug: {
				command: "deno",
				args: ["run", "-A", path.resolve(__dirname, "../../server.ts")],
				transport: vsclient.TransportKind.stdio,
			},
		},
		{
			documentSelector: [
				{
					scheme: "file",
					language: "markdown",
				},
			],
		},
	);
	client.start();
	context.subscriptions.push(client, logger);
}

module.exports = { activate };
