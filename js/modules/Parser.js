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

	//What have I done...
	// function clean (item) {
	// 	const [lastname, firstname] = (item.authors||{"main-author":{_text:"defined, un"}})["main-author"]._text.split(", ");
	// 	let [raw, pages, type, size] = /\[?(\d+)\]? (?:ongenummerde)? ?p(?:agina(?:'|&#x2019;)s)?[^;]*?:? ?([^;]+)? ; (\d+(?:x| ?× ?)?\d* cm)/g.exec((item.description||{"physical-description":{}})["physical-description"]._text) || [null, null, null, null];
	// 	if (!size) size = /.*(\d+(?:x| × )?\d* cm)/g.exec((item.description||{"physical-description":{}})["physical-description"]._text);
	// 	return {
	// 		author: {
	// 			fullname: `${firstname} ${lastname}`,
	// 			firstname: firstname,
	// 			lastname: lastname
	// 		},
	// 		images: [item.coverimages.coverimage].flat().map(coverimage => coverimage._text).filter(url => !url.includes("~")),
	// 		title: {
	// 			// short: (item.titles||{"short-title":{}})["short-title"]._text, //For some reason, this ALWAYS errors.. I don't understand :(
	// 			full: item.titles.title._text
	// 		},
	// 		format: item.formats.format._text,
	// 		identifiers: Object.entries(item.identifiers||{}).map(([identifier, body]) => {return {[identifier]: body._text}}),
	// 		publication: {
	// 			year: (item.publication||{year:{}}).year._text,
	// 			publisher: (item.publication||{publishers:{publisher:{}}}).publishers.publisher._text,
	// 			place: (item.publication||{publishers:{publisher:{place:undefined}}}).publishers.publisher.place
	// 		},
	// 		languages: {
	// 			this: (item.languages||{language:{}}.language)._text,
	// 			original: ((item.languages||{})["original-language"] || (item.languages||{}).language || {})._text
	// 		},
	// 		subjects: [(item.subjects||{})["topical-subject"]||{}].flat().map(subject => subject._text),
	// 		genres: [(item.genres||{genre:{}}).genre].flat().map(genre => genre._text),
	// 		characteristics: {
	// 			pages: Number(pages),
	// 			size: size,
	// 			types: (type||"").split(",").map(string => string.trim()),
	// 			raw: raw
	// 		},
	// 		summary: (item.summaries||{summary:{}}).summary._text,
	// 		notes: [(item.notes || {}).note||{}].flat().map(note => note._text || null).filter(note => note !== null),
	// 		targetAudiences: [(item["target-audiences"] && item["target-audiences"] || {})["target-audience"]||{}].flat().map(audience => audience._text || null).filter(audience => audience !== null),
	// 		series: ((item.series && item.series["series-title"] && item.series["series-title"]._text) || null)
	// 	};
	// }

	// return root.map(clean);
	return root;
}