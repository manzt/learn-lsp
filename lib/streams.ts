/**
 * A custom `TransformStream` that parses Language Server Protocol (LSP)
 * messages from a raw byte stream and emits the message bodies as strings.
 *
 * LSP messages are sent over a stream (typically stdin/stdout) using a
 * header-based protocol. Each message begins with a header section, followed
 * by `\r\n\r\n`, and then a JSON body. The `Content-Length` header indicates
 * how many bytes long the body is.
 *
 * Example raw message:
 *
 * ```
 * Content-Length: 72\r\n
 * \r\n
 * {"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}
 * ```
 *
 * This stream buffers incoming `Uint8Array` chunks, extracts complete
 * messages according to the LSP format, and emits each full JSON body
 * (as a string) downstream.
 *
 * Example usage:
 *
 * ```ts
 * let reader = getLspByteStreamSomehow(); // ReadableStream<Uint8Array>
 * let messageStream = reader.pipeThrough(new LspMessageStream());
 *
 * for await (let message of messageStream) {
 *   handleLspMessage(JSON.parse(message));
 * }
 * ```
 */
export class LspMessageStream extends TransformStream<Uint8Array, string> {
	constructor() {
		let buffer = "";
		let decoder = new TextDecoder();
		super({
			transform(chunk, controller) {
				buffer += decoder.decode(chunk, { stream: true });
				while (true) {
					let split = buffer.indexOf("\r\n\r\n");
					if (split === -1) {
						break;
					}

					let header = buffer.slice(0, split);
					let contentLengthMatch = header.match(/Content-Length: (\d+)/i);

					if (!contentLengthMatch) {
						throw new Error("Missing Content-Length");
					}

					let contentLength = parseInt(contentLengthMatch[1], 10);
					let totalLength = split + 4 + contentLength;

					if (buffer.length < totalLength) {
						break;
					}

					controller.enqueue(buffer.slice(split + 4, totalLength));
					buffer = buffer.slice(totalLength);
				}
			},
		});
	}
}
