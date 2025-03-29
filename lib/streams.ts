export class LspMessageStream extends TransformStream<Uint8Array, string> {
	constructor() {
		let decoder = new TextDecoder();
		let buffer = "";

		super({
			transform(chunk, controller) {
				buffer += decoder.decode(chunk, { stream: true });
				while (true) {
					let headerEnd = buffer.indexOf("\r\n\r\n");
					if (headerEnd === -1) {
						break;
					}

					let header = buffer.slice(0, headerEnd);
					let contentLengthMatch = header.match(/Content-Length: (\d+)/i);

					if (!contentLengthMatch) {
						throw new Error("Missing Content-Length");
					}

					let contentLength = parseInt(contentLengthMatch[1], 10);
					let totalMessageLength = headerEnd + 4 + contentLength;

					if (buffer.length < totalMessageLength) {
						break;
					}

					controller.enqueue(
						buffer.slice(headerEnd + 4, totalMessageLength),
					);
					buffer = buffer.slice(totalMessageLength);
				}
			},
		});
	}
}
