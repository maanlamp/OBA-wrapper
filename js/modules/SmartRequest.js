import { timeout } from "./utils.js";
import LWZ from "./LZW.js";

export default async function smartRequest (url = "", options = {
	maxTries: 5,
	format: "text"
}) {
	//Acts like a simple fetch, but retries 4 times before rejecting if server is busy
	//implements exponential backoff https://developers.google.com/analytics/devguides/reporting/core/v3/errors#backoff
	//CHECK FOR RETRY-AFTER HEADER IF STATUS === 429 || STATUSTEXT.MATCH("TOO MANY REQUESTS")
	//Allow other formats than text
	const cached = inCache(url);
	if (cached !== false) return cached;

	const fetchOptions = getFetchSafeOptions(options);
	const maxTries = options.maxTries;
	const retryStatusCodes = [500, 502, 503, 504];
	const retryStatusTexts = [
		"Internal Server Error", //500
		"Bad Gateway", //502
		"Service Unavailable", //503
		"Gateway Timeout" //504
	];

	try {
		const response = await $try(url, maxTries);
		return await cache(url, await response.text());
	} catch (error) {
		if (error.status) return error;
		throw error;
	}

	function getFetchSafeOptions (object) {
		return {
			headers: {
				"Accept": "text/plain, application/xml"
			}
		};
	}

	function padding (tries) {
		return tries ** 2 * 1000 + Math.floor(Math.random() * 1000);
	}

	function inCache (url) {
		const value = localStorage.getItem(url);
		return (value !== null)
			? (console.log("Cache match"), LWZ.decompress(value))
			: false;
	}

	function cannotRetry (error) {
		return !(retryStatusCodes.includes(error.status)
			|| (error.statusText && retryStatusTexts
					.some(retryErr => error.statusText
						.toLowerCase()
						.match(retryErr.toLowerCase()))));
	}

	async function $try (url, maxTries, tries = 0) {
		if (tries >= maxTries) throw new Error(`Polling limit (${maxTries}) was exceeded without getting a valid response.`);
		try {
			return await fetch(url, fetchOptions);
		} catch (error) {
			if (cannotRetry(error)) throw error;
			await timeout(padding(tries++));
			return $try(url, maxTries, tries);
		}
	}

	async function cache (key, value) {
		localStorage.setItem(String(key), LWZ.compress(value));
		return value;
	}
}