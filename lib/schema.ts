import { Schema } from "effect";

export function writeResponse<T>(
	writer: WritableStreamDefaultWriter<Uint8Array>,
	options: {
		id: string | number | null;
		result?: T;
		error?: { code: number; message: string };
	},
) {
	let json = ResponseMessage.encode({
		jsonrpc: "2.0",
		id: options.id,
		...(options.error ? { error: options.error } : { result: options.result }),
	});
	let contentBytes = new TextEncoder().encode(json);
	let headers = `Content-Length: ${contentBytes.byteLength}\r\n\r\n`;
	let headerBytes = new TextEncoder().encode(headers);
	writer.write(headerBytes);
	writer.write(contentBytes);
}

/**
 * https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#abstractMessage
 */
let Message = Schema.Struct({
	jsonrpc: Schema.String,
});

/**
 * https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#requestMessage
 */
export class RequestMessage
	extends Schema.Class<RequestMessage>("RequestMessage")({
		...Message.fields,
		id: Schema.optional(Schema.Union(Schema.Number, Schema.String)),
		/**
		 * The method to be invoked.
		 */
		method: Schema.String,
		/**
		 * The method's params.
		 */
		params: Schema.optional(Schema.Unknown),
	}) {
	static encode = Schema.encodeSync(Schema.parseJson(RequestMessage));
	static decode = Schema.decodeEither(Schema.parseJson(RequestMessage));
}

let ResponseError = Schema.Struct({
	/**
	 * A number indicating the error type that occurred.
	 */
	code: Schema.Number,
	/**
	 * A string providing a short description of the error.
	 */
	message: Schema.String,
	/**
	 * A primitive or structured value that contains additional
	 * information about the error. Can be omitted.
	 */
	data: Schema.optional(Schema.Any),
});

export class ResponseMessage
	extends Schema.Class<ResponseMessage>("ResponseMessage")({
		...Message.fields,
		/**
		 * The request id.
		 */
		id: Schema.Union(Schema.Number, Schema.String, Schema.Null),
		/**
		 * The result of a request. This member is REQUIRED on success.
		 * This member MUST NOT exist if there was an error invoking the method.
		 */
		result: Schema.optional(Schema.Any),
		/**
		 * The error object in case a request fails.
		 */
		error: Schema.optional(ResponseError),
	}) {
	static encode = Schema.encodeSync(Schema.parseJson(ResponseMessage));
}

export class InitializeParams
	extends Schema.Class<InitializeParams>("InitializeParams")({
		/**
		 * Information about the client
		 *
		 * @since 3.15.0
		 */
		clientInfo: Schema.optional(Schema.Struct({
			/**
			 * The name of the client as defined by the client.
			 */
			name: Schema.String,
			/**
			 * The client's version as defined by the client.
			 */
			version: Schema.optional(Schema.String),
		})),
	}) {
	static decode = Schema.decodeUnknownSync(InitializeParams);
}

export class ServerCapabilities
	extends Schema.Class<ServerCapabilities>("ServerCapabilities")({}) {}

export class InitializeResult
	extends Schema.Class<InitializeResult>("InitializeResult")({
		/**
		 * The capabilities the language server provides.
		 */
		capabilities: ServerCapabilities,
		/**
		 * Information about the server.
		 *
		 * @since 3.15.0
		 */
		clientInfo: Schema.optional(Schema.Struct({
			/**
			 * The name of the client as defined by the client.
			 */
			name: Schema.String,
			/**
			 * The client's version as defined by the client.
			 */
			version: Schema.optional(Schema.String),
		})),
	}) {}
