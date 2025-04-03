import { Logger } from "./logger.ts";
import { LspMessageStream } from "./streams.ts";
import * as lsp from "./schema.ts";

if (import.meta.main) {
	let reader = Deno.stdin.readable.pipeThrough(new LspMessageStream());
	let writer = Deno.stdout.writable.getWriter();
	using logger = new Logger(
		new URL("../logs.txt", import.meta.url),
	);

	for await (let jsonMessage of reader) {
		let message = lsp.RequestMessage.decodeJson(jsonMessage);
		logger.log(message.method, jsonMessage);

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
				logger.error("Unknown method:", jsonMessage);
		}
	}
}
