const PromiseStream = require("promisestream");
const smartfetch = require("smartfetch");
const fetch = require("node-fetch");
const XMLParser = require("xml-to-json-promise").xmlDataToJSON;

const smartfetchOptions = {
	store: {
		values: new Map(),
		get: (key) => this.values.get(key),
		set: (key, value) => this.values.set(key, value)
	}
};

function range (size = 0, end = size) {
	//refactor this shizzle?
	if (size === end) return [...Array(size).keys()];
	return [...Array(end - size).keys()].map((_, i) => i + size);
}

class Pong {
	constructor (count = 0, context = "") {
		this.count = Number(count);
		this.context = String(context);
	}
}

function detectPingError (res) {
	if (!res.ok) throw new Error(`Cannot ping ${res.url} ${res.status} (${res.statusText})`);
	return res;
}

function buildPong (json) {
	return new Pong(
		Number(json.aquabrowser.meta[0].count[0]),
		String(json.aquabrowser.meta[0].rctx[0]));
}

function supressPingError (err) {
	console.warn(`Supressed ${err}`);
	return new Pong();
}

function XMLToJSON (xml) {
	return XMLParser(xml);
}

function handleJSONParserError (json) {
	const err = json.aquabrowser.error;
	if (err) throw new Error(`${err.code[0]} ${err.reason[0]}`);
	return json;
}

module.exports = class API {
	constructor ({
		CORSProxy = "https://cors-anywhere.herokuapp.com/",
		baseURL = "https://zoeken.oba.nl/api/v1/",
		key = "NO_KEY_PROVIDED"
	} = {}) {
		this._context = null;
		this._URL = CORSProxy
			+ baseURL
			+ "ENDPOINT" //will be `.replace`d later (is this a good practise?)
			+ "?authorization="
			+ key;
	}

	static logError (error) {
		console.error(
			"%c%s\n%c%s",
				"color: #F92672;",
				error.message,
				"color: black;",
				error.stack.replace(/^.+\n/, ""));

		throw error;
	}

	_parsePartial (partial) {
		//if (partial.toString() === "[object Object]") return {}; //If partial is omitted, allow for options fallback
		//Expect: endpoint/query (can include spaces){count?,pagesize?}
		const regex = /(?<endpoint>\w+)\/?(?<value>[^/\{]+)(?:\{(?<max>\d+)?(?:,\s*)?(?<pagesize>\d+)?\})?/;
		if (!regex.test(partial)) throw new Error(`'${partial}' is not a valid endpoint and/or query.`);

		const {
			endpoint,
			value,
			max = 20,
			pagesize = 20
		} = partial.match(regex).groups;
		if (pagesize > 20) console.warn(`API supports, at most, 20 results at a time – not ${pagesize}.`);

		const query = (() => {
			switch (endpoint) {
				case "search": return "q";
				case "details": //fallthrough
				case "availability": return "id";
				default: throw new Error(`Unknown/unsupported endpoint '${endpoint}'`);
			}
		})();

		return {
			endpoint,
			query: encodeURI(`&${query}=${value.trim()}`),
			max: Number(max),
			pagesize: Math.min(
				Number(max),
				Number(pagesize))
		};
	}

	async _getRequestSpecifics (partial, options) {
		if (partial === undefined) throw new Error("Failed to get request specifics. Did you forget a url?");

		const {
			endpoint,
			query,
			max,
			pagesize
		} = Object.assign({}, this._parsePartial(partial), options);
		const url = this._URL.replace("ENDPOINT", endpoint) + query;
		const {count, context} = await this._ping(url, this._context);
		const batches = Math.ceil(Math.min(max, count) / pagesize);
		const builtURL = url + `&pagesize=${pagesize}&refine=true`;

		this._context = context;

		return {batches, builtURL, count};
	}

	_ping (url, context) {
		const builtURL = (context !== null)
			? url + `&pagesize=1&refine=false&rctx=${context}`
			: url + `&pagesize=1&refine=false`;

		return fetch(builtURL, {headers:{"Origin": null}}) //test if it's beneficial to use smartrequest here
			.then(detectPingError)
			.then(res => res.text())
			.then(XMLToJSON)
			.then(handleJSONParserError)
			.then(buildPong)
			.catch(supressPingError);
	}

	async createStream (partial, options = {}) {
		const {
			batches,
			builtURL,
			count
		} = await this._getRequestSpecifics(partial, options);

		if (count === 0) throw new Error(`No results found for '${partial}'.`);

		return new PromiseStream(
				range(batches)
					.map(index => builtURL + `&page=${index + 1}&rctx=${this._context}`)
					.map(url => smartfetch(url, smartfetchOptions)))
			.pipe(XMLToJSON)
			.catch(API.logError);
	}

	async createIterator (partial, options = {}) {
		const {
			batches,
			builtURL,
			count
		} = await this._getRequestSpecifics(partial, options);

		if (count === 0) throw new Error(`No results found for '${partial}'.`);

		async function* iterator () {
			const requests = range(batches)
				.map(index => builtURL + `&page=${index + 1}&rctx=${this._context}`);

			while (requests.length > 0) {
				const url = requests.shift();
				yield await smartfetch(url, smartfetchOptions)
					.then(XMLToJSON)
					.catch(API.logError);
			}
		}

		return iterator.call(this);
	}

	async createPromise (partial, options = {}) {
		const {
			batches,
			builtURL,
			count
		} = await this._getRequestSpecifics(partial, options);

		if (count === 0) throw new Error(`No results found for '${partial}'.`);

		return range(batches)
			.map(index => builtURL + `&page=${index + 1}&rctx=${this._context}`)
			.map(url => smartfetch(url, smartfetchOptions)
				.then(XMLToJSON)
				.catch(API.logError));
	}

	availability (frabl) { //I hate this "solution", please fix dis kty <3
		const url = this._URL.replace("ENDPOINT", "availability");
		return smartfetch(url + `&frabl=${frabl}`, smartfetchOptions)
			.then(XMLToJSON)
			.catch(API.logError);
	}

	details (frabl) { //I hate this "solution", please fix dis kty <3
		const url = this._URL.replace("ENDPOINT", "details");
		return smartfetch(url + `&frabl=${frabl}`, smartfetchOptions)
			.then(XMLToJSON)
			.catch(API.logError);
	}
}