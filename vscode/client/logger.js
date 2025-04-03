const vscode = require("vscode");

class Logger {
	/** @param {string} name */
	constructor(name) {
		this.output = vscode.window.createOutputChannel(name);
		this.log("started");
	}

	/**
	 * @param {Array<string>} messages
	 * @param {"INFO" | "DEBUG" | "WARN" | "ERROR"} level
	 */
	#log(messages, level) {
		this.output.appendLine(
			`[${new Date().toISOString()}] [${level}] ${messages.join(" ")}`,
		);
	}

	/** * @param {Array<string>} message */
	log(...message) {
		this.#log(message, "INFO");
	}

	/** * @param {Array<string>} message */
	warn(...message) {
		this.#log(message, "WARN");
	}

	/** * @param {Array<string>} message */
	error(...message) {
		this.#log(message, "ERROR");
	}

	dispose() {
		this.output.dispose();
	}
}

module.exports = { Logger };