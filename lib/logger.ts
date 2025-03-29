export class Logger {
	#file: Deno.FsFile;

	constructor(path: URL) {
		this.#file = Deno.createSync(path);
	}

	#log(msgs: Array<string>, level: "INFO" | "WARN" | "ERROR") {
		const timestamp = new Date().toISOString();
		const line = `[${timestamp}] [${level}] ${msgs.join(" ")}\n`;
		this.#file.writeSync(new TextEncoder().encode(line));
	}

	log(...msg: Array<string>) {
		this.#log(msg, "INFO");
	}

	warn(...msg: Array<string>) {
		this.#log(msg, "WARN");
	}

	error(...msg: Array<string>) {
		this.#log(msg, "ERROR");
	}

	[Symbol.dispose]() {
		this.#file.close();
	}
}
