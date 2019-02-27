import { range } from "./modules/utils.js";
import { detectPingError, buildPong, supressPingError } from "./modules/ping.js";
import PromiseStream from "./modules/PromiseStream.js";
import { XMLToJSON, handleJSONParserError, cleanAquabrowserJSON } from "./modules/Parser.js";
import smartRequest from "./modules/SmartRequest.js";

export class API {
	constructor ({
		CORSProxy = "https://cors-anywhere.herokuapp.com/",
		baseURL = "https://zoeken.oba.nl/api/v1/",
		key = "NULL"
	} = {}) {
		this._URL = CORSProxy
			+ baseURL
			+ "ENDPOINT" //will be `.replace`d later (is this a good practise?)
			+ "?authorization="
			+ key;
	}

	_parsePartial (partial) {
		//Expect: endpoint/query (can include spaces){count?,batchsize?}
		const regex = /(?<endpoint>\w+)\/(?<value>[^\{]+)(?:\{(?<max>\d+)?(?:,\s*)?(?<batchsize>\d+)?\})?/;
		if (!regex.test(partial)) throw new Error(`'${partial}' is not a valid endpoint and/or query.`);

		const {
			endpoint,
			value,
			max = 20,
			batchsize = 20
		} = partial.match(regex).groups;
		if (batchsize > 20) console.warn(`API supports, at most, 20 results at a time – not ${batchsize}.`);

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
			query: `&${query}=${value.trim()}`,
			max: Number(max),
			batchsize: Math.min(
				Number(max),
				Number(batchsize))
		};
	}

	async _getRequestSpecifics (partial) {
		const {
			endpoint,
			query,
			max,
			batchsize
		} = this._parsePartial(partial);
		const url = this._URL.replace("ENDPOINT", endpoint) + query;
		const {count, context} = await this._ping(url);
		const batches = Math.ceil(Math.min(max, count) / batchsize);
		const builtURL = url + `&pagesize=${batchsize}&refine=true`;

		return {batches, builtURL, context, count};
	}

	_ping (url) {
		const builtURL = url + "&pagesize=1&refine=false";

		return fetch(builtURL)
			.then(detectPingError)
			.then(res => res.text())
			.then(XMLToJSON)
			.then(handleJSONParserError)
			.then(buildPong)
			.catch(supressPingError);
	}

	async createStream (partial) {
		const {
			batches,
			builtURL,
			context,
			count
		} = await this._getRequestSpecifics(partial);

		if (count === 0) throw new Error(`No results found for '${partial}'.`);

		return new PromiseStream(range(batches)
				.map(index => builtURL + `&page=${index + 1}&rctx=${context}`)
				.map(url => smartRequest(url)))
			.pipe(XMLToJSON)
			.pipe(cleanAquabrowserJSON)
			.catch(console.error);
	}

	async createIterator (partial) {
		const {
			batches,
			builtURL,
			context,
			count
		} = await this._getRequestSpecifics(partial);

		if (count === 0) throw new Error(`No results found for '${partial}'.`);

		async function* iterator () {
			const requests = range(batches)
				.map(index => builtURL + `&page=${index + 1}&rctx=${context}`);

			while (requests.length > 0) {
				const url = requests.shift();
				yield await smartRequest(url)
					.then(XMLToJSON)
					.then(cleanAquabrowserJSON)
					.catch(console.error);
			}
		}

		return iterator();
	}

	async createPromise (partial) {
		const {
			batches,
			builtURL,
			context,
			count
		} = await this._getRequestSpecifics(partial);

		if (count === 0) throw new Error(`No results found for '${partial}'.`);

		return range(batches)
			.map(index => builtURL + `&page=${index + 1}&rctx=${context}`)
			.map(url => smartRequest(url)
				.then(XMLToJSON)
				.then(cleanAquabrowserJSON)
				.catch(console.error));
	}
}

window.API = API;