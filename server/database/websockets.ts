import type { WebSocket } from "ws";

/**
 * Standard close codes based on https://www.rfc-editor.org/rfc/rfc6455.html#section-7.4.1
 */
export enum WebSocketCode {
	/** Normal exit. */
	NORMAL = 1000,

	/** An endpoint went offline and did not return. */
	WENT_AWAY = 1001,

	/** Received unexpected input. */
	PROTOCOL_ERROR = 1002,
}

export function close(ws: WebSocket, code: WebSocketCode, reason: string): void {
	ws.close(code, reason);
}

export function send(ws: WebSocket, message: unknown): void {
	ws.send(JSON.stringify(message));
}

export type { WebSocket };
