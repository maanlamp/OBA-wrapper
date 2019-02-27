import { isObject } from "./utils.js";

export function XMLToJSON (xml) {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xml, "application/xml");

	function parse (xmldoc) {
		const nodeTypes = {
			"element": 1,
			"text": 3
		};
		let json = {};

		if (xmldoc.nodeType === nodeTypes["element"]) {
			if (xmldoc.attributes.length > 0) {
				json["_attributes"] = {};
			}

			for (const attr of xmldoc.attributes) {
				json["_attributes"][attr.nodeName] = attr.nodeValue;
			}
		} else if (xmldoc.nodeType === nodeTypes["text"]) {
			json = xmldoc.nodeValue;
		}

		if (xmldoc.hasChildNodes()) {
			for (const child of xmldoc.childNodes) {
				const nodeName = child.nodeName.replace(/^#/, "_");

				if (json[nodeName] === undefined) {
					json[nodeName] = parse(child);
				} else {
					if (json[nodeName].push === undefined) {
						json[nodeName] = Array(json[nodeName]);
					}
					json[nodeName].push(parse(child));
				}
			}
		}

		return json;
	}

	return parse(doc);
}

export function JSONToXML (json) {
	//?
}

export function handleJSONParserError (json) {
	const err = json.aquabrowser.error;
	if (err) throw new Error(`${err.code._text} ${err.reason._text}`);
	return json;
}
export function filterWhitespaceElements (val) {
	if (typeof val.filter !== "function") return val;
	return val.filter(item => {
		return (typeof item === "string") ? /^\S+$/.test(item) : item;
	});
}
export function cleanAquabrowserJSON (json) {
	const root = json.aquabrowser.results.result;

	function clean (obj = {}) {
		Object.entries(obj)
			.map(([key, value]) => {
				if (value.filter)    value = filterWhitespaceElements(value);
				if (isObject(value)) value = clean(value);
				obj[key] = value;
			});

		return obj;
	}

	return clean(root);
}