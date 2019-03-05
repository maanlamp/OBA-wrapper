import { range } from "./modules/utils.js";
import { detectPingError, buildPong, supressPingError } from "./modules/ping.js";
import PromiseStream from "./modules/PromiseStream.js";
import { XMLToJSON, handleJSONParserError, cleanAquabrowserJSON } from "./modules/Parser.js";
import smartRequest from "./modules/SmartRequest.js";

export class API {
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

		return fetch(builtURL)
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
					.map(url => smartRequest(url)))
			.pipe(XMLToJSON)
			.pipe(cleanAquabrowserJSON)
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
				yield await smartRequest(url)
					.then(XMLToJSON)
					.then(cleanAquabrowserJSON)
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
			.map(url => smartRequest(url)
				.then(XMLToJSON)
				.then(cleanAquabrowserJSON)
				.catch(API.logError));
	}
}

window.API = API;