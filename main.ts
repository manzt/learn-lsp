import { Either } from "effect";

import { Logger } from "./lib/logger.ts";
import { LspMessageStream } from "./lib/streams.ts";
import * as lsp from "./lib/schema.ts";

if (import.meta.main) {
	let reader = Deno.stdin.readable.pipeThrough(new LspMessageStream());
	let writer = Deno.stdout.writable.getWriter();
	using logger = new Logger(
		new URL("logs.txt", import.meta.url),
	);

	logger.log("started");

	for await (let json of reader) {
		let message = Either.match(lsp.RequestMessage.decode(json), {
			onLeft: (left) => {
				logger.error(json);
				logger.error(left.toString());
				Deno.exit(1);
			},
			onRight: (right) => {
				return right;
			},
		});
		logger.log(message.method, json);

		switch (message.method) {
			case "initialize": {
				let params = lsp.InitializeParams.decode(message.params);
				lsp.writeResponse(writer, {
					id: message.id ?? null,
					result: new lsp.InitializeResult({
						capabilities: new lsp.ServerCapabilities({}),
						clientInfo: params.clientInfo,
					}),
				});
				break;
			}
			case "textDocument/didSave":
			case "initialized":
				break;
			case "shutdown": {
				Deno.exit(0);
				break;
			}
			default:
				logger.error("Unknown method:", json);
		}
	}
}
