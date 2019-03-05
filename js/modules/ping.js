class Pong {
	constructor (count = 0, context = "") {
		this.count = Number(count);
		this.context = String(context);
	}
}

export function detectPingError (res) {
	if (!res.ok) throw new Error(`Cannot ping ${res.url} ${res.status} (${res.statusText})`);
	return res;
}

export function buildPong (json) {
	return new Pong(
		Number(json.aquabrowser.meta.count._text),
		String(json.aquabrowser.meta.rctx._text));
}

export function supressPingError (err) {
	console.warn(`Supressed ${err}`);
	return new Pong();
}