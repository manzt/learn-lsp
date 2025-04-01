import { Schema } from "effect";

export function respondWith<T>(
	writer: WritableStreamDefaultWriter<Uint8Array>,
	options: {
		id?: string | number | null;
		result?: T;
		error?: { code: number; message: string };
	},
) {
	let json = ResponseMessage.encodeJson({
		jsonrpc: "2.0",
		id: options.id ?? null,
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
	static encodeJson = Schema.encodeSync(Schema.parseJson(RequestMessage));
	static decodeJson = Schema.decodeEither(Schema.parseJson(RequestMessage));
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
	static encodeJson = Schema.encodeSync(Schema.parseJson(ResponseMessage));
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

class Position extends Schema.Class<Position>("Position")({
	/**
	 * Line position in a document (zero-based).
	 */
	line: Schema.Number,

	/**
	 * Character offset on a line in a document (zero-based). The meaning of this
	 * offset is determined by the negotiated `PositionEncodingKind`.
	 *
	 * If the character value is greater than the line length it defaults back
	 * to the line length.
	 */
	character: Schema.Number,
}) {}

class TextDocumentIdentifier
	extends Schema.Class<TextDocumentIdentifier>("TextDocumentIdentifier")({
		/**
		 * The text document's URI.
		 */
		uri: Schema.String,
	}) {}

class WorkDoneProgressParams
	extends Schema.Class<WorkDoneProgressParams>("WorkDoneProgressParams")({
		/**
		 * An optional token that a server can use to report work done progress.
		 */
		workDoneToken: Schema.optional(Schema.Union(Schema.String, Schema.Number)),
	}) {}

export class TextDocumentPositionParams
	extends Schema.Class<TextDocumentPositionParams>(
		"TextDocumentPositionParams",
	)({
		/**
		 * The text document.
		 */
		textDocument: TextDocumentIdentifier,
		/**
		 * The position inside the text document.
		 */
		position: Position,
	}) {
	static decode = Schema.decodeUnknownSync(TextDocumentPositionParams);
}

let HoverOptions = Schema.Struct({
	...TextDocumentPositionParams.fields,
	...WorkDoneProgressParams.fields,
});

export class ServerCapabilities
	extends Schema.Class<ServerCapabilities>("ServerCapabilities")({
		/**
		 * The server provides hover support.
		 */
		hoverProvider: Schema.optional(Schema.Union(Schema.Boolean, HoverOptions)), // HoverOptions;
	}) {}

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

export class Range extends Schema.Class<Range>("Range")({
	start: Position,
	end: Position,
}) {}

/**
 * A `MarkupContent` literal represents a string value which content is
 * interpreted base on its kind flag. Currently the protocol supports
 * `plaintext` and `markdown` as markup kinds.
 *
 * If the kind is `markdown` then the value can contain fenced code blocks like
 * in GitHub issues.
 *
 * Here is an example how such a string can be constructed using
 * JavaScript / TypeScript:
 * ```typescript
 * let markdown = new MarkdownContent({
 *  kind: "markdown",
 *  value: [
 *    '# Header',
 *    'Some text',
 *    '```typescript',
 *    'someCode();',
 *    '```'
 *  ].join('\n')
 * });
 * ```
 *
 * *Please Note* that clients might sanitize the return markdown. A client could
 * decide to remove HTML from the markdown to avoid script execution.
 */
export class MarkupContent
	extends Schema.Class<MarkupContent>("MarkupContent")({
		/**
		 * The type of the Markup
		 */
		kind: Schema.Literal("plaintext", "markdown"),
		/**
		 * The content itself
		 */
		value: Schema.String,
	}) {
}

/**
 * The result of a hover request.
 */
export class Hover extends Schema.Class<Hover>("Hover")({
	/**
	 * The hover's content
	 */
	contents: MarkupContent,
	/**
	 * An optional range is a range inside a text document
	 * that is used to visualize a hover, e.g. by changing the background color.
	 */
	range: Schema.optional(Range),
}) {
}
