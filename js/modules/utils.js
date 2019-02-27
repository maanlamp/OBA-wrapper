export function range (size = 0, end = size) {
	//refactor this shizzle?
	if (size === end) return [...Array(size).keys()];
	return [...Array(end - size).keys()].map((_, i) => i + size);
}

export function timeout (timeout, code = 200, message = "OK") {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			resolve({status: code, statusText: message});
		}, timeout);
	});
}

export function timeoutFail (timeout, code = 404, message = "Not Found") {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			reject({status: code, statusText: message});
		}, timeout);
	});
}

export function timeoutFailable (timeout, codes = {
	succes: 200,
	fail: 404
}, messages = {
	succes: "OK",
	fail: "Service Unavailable"
}) {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			(Math.random() <= .5)
				? reject({status: codes.fail, statusText: messages.fail})
				: resolve({status: codes.succes, statusText: messages.succes});
		}, timeout);
	});
}

export function msToSecs (ms) {
	return ms * 1000;
}

export function secsToMs (secs) {
	return secs / 1000;
}

export function isObject (val) {
	return Object.prototype.toString.call(val) === "[object Object]";
}