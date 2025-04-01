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

	for await (let unknownMessage of reader) {
		let message = Either.match(
			lsp.RequestMessage.decodeJson(unknownMessage),
			{
				onLeft: (left) => {
					logger.error(unknownMessage);
					logger.error(left.toString());
					Deno.exit(1);
				},
				onRight: (right) => right,
			},
		);
		logger.log(message.method, unknownMessage);

		switch (message.method) {
			case "initialize": {
				let params = lsp.InitializeParams.decode(message.params);
				lsp.respondWith(writer, {
					id: message.id,
					result: new lsp.InitializeResult({
						capabilities: new lsp.ServerCapabilities({
							hoverProvider: true,
						}),
						clientInfo: params.clientInfo,
					}),
				});
				break;
			}
			case "textDocument/hover": {
				let params = lsp.TextDocumentPositionParams.decode(message.params);
				lsp.respondWith(writer, {
					id: message.id,
					result: new lsp.Hover({
						contents: new lsp.MarkupContent({
							kind: "markdown",
							value: [
								"# Header",
								"This is some special content.",
								"",
								"```typescript",
								'import * as zarr from "npm:zarrita";',
								"",
								'let store = new FetchStore("https://localhost:8080/data.zarr");',
								'let arr = zarr.open(store, { kind: "array" });',
								"```",
								"",
								`**Hover** at line ${params.position.line}, character ${params.position.character}`,
							].join("\n"),
						}),
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
				logger.error("Unknown method:", unknownMessage);
		}
	}
}
