![The OBA-wrapper logo](logo.png)

# OBA-wrapper
The OBA ([Openbare Bibliotheek Amsterdam](https://oba.nl)) has a public API that is usable by *everyone* to create very cool stuff; [here is a list of such cool stuff](https://www.oba.nl/actueel/obahva/techtrack.html).

Sadly, the API is a bit clunky, so I set out to make it easy to work with!

_Built and maintained by [@maanlamp](https://github.com/maanlamp)._

> Don't forget to ⭐ the repo if you like it :)

<br/>

---

<br/>

## Glossary
<details>
  <summary>Click to expand</summary>

- [OBA-wrapper](#oba-wrapper)
	- [Glossary](#glossary)
	- [User feedback](#user-feedback)
	- [Getting started](#getting-started)
	- [Iteration plan / planned features](#iteration-plan--planned-features)
	- [Tips for understanding the docs](#tips-for-understanding-the-docs)
	- [Technologies](#technologies)
		- [Simple Promise (Native promises)](#simple-promise-native-promises)
			- [How to use](#how-to-use)
		- [Promise streaming (Concurrency)](#promise-streaming-concurrency)
			- [How to use](#how-to-use-1)
				- [<code>PromiseStream.prepend (*any[]:* ...values) -> PromiseStream</code>](#codepromisestreamprepend-any-values---promisestreamcode)
				- [<code>PromiseStream.append (*any[]:* ...values) -> PromiseStream</code>](#codepromisestreamappend-any-values---promisestreamcode)
				- [<code>PromiseStream.insert (*number*: index?, *any[]:* ...values) -> PromiseStream</code>](#codepromisestreaminsert-number-index-any-values---promisestreamcode)
				- [<code>PromiseStream.pipe (*function:* through) -> PromiseStream</code>](#codepromisestreampipe-function-through---promisestreamcode)
				- [<code>PromiseStream.pipeOrdered(*function:* through) -> PromiseStream</code>](#codepromisestreampipeorderedfunction-through---promisestreamcode)
				- [<code>PromiseStream.all () -> Promise<Any[]></code>](#codepromisestreamall----promiseanycode)
				- [<code>PromiseStream.catch (*function:* handler) -> PromiseStream</code>](#codepromisestreamcatch-function-handler---promisestreamcode)
		- [Asynchronous iterator (Consecutiveness)](#asynchronous-iterator-consecutiveness)
			- [How to use](#how-to-use-2)
				- [<code>for await ... of ...</code>](#codefor-await--of-code)
		- ["Smart" Requests](#%22smart%22-requests)
			- [How to use](#how-to-use-3)
				- [<code>smartRequest(_url_: url, _object_: options?) -> Promise\<response\></code>](#codesmartrequesturl-url-object-options---promiseresponsecode)
	- [License](#license)
</details>

<br/>
<br/>
<br/>

---

<br/>

## User feedback
> **The easiest way to interface with the OBA API!<br/>**
> \- _Maanlamp, 2019_

> **Insanely easy to use!<br/>**
> \- _Maanlamp, 2019_

> **WOW! 😱<br/>**
> \- _Maanlamp, 2019_

> **Your feedback here?**<br/>
> \- Name


<br/>
<br/>
<br/>

---

<br/>

## Getting started
the recommended way to use this wrapper is through some sort of package manager, such as *NPM*:

```shell
npm i github:maanlamp/OBA-wrapper
```

This way, you are sure to get the latest version, and you can easily update using the package manager aswell.

Since the wrapper is only client side (currently), you can just download the the entire `js` folder, and import `index.js` into your html as follows:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- ... -->
  <script src="./js/index.js" type="module"></script>
  <!-- ... -->
</head>
<!-- ... -->
```

- Note that it is not needed to import it at the bottom of a `<body>` tag, since a module will always be loaded after the document.

- `type="module"` is *VERY* important.

- Also note that if you use a package manager, the url will probably be different. For example: for npm the url would be `node_modules/OBA-wrapper/js/index.js`.

The quickest way to start a working request is as follows:
```js
(async () => {
  localStorage.clear();

  const api = new API({
      key: "ADD YOUR KEY HERE"
  });
  const stream = await api.createStream("search/banaan{5}");

  stream
    .pipe(stringify)
    .pipe(console.log)
    .catch(console.error);
})();
```

You can also [just have some fun inside the sandbox](./test.html)!

<br/>
<br/>

---

<br/>


## Iteration plan / planned features

| Symbol | Description |
|-|-|
| 🏃 | Will be in next release |
| 💪 | Expected in next release |
| ⚫️ | Under discussion |

- [ ] 🏃 Make server-side usage possible.
- [ ] ⚫️ Make a `[Symbol().asyncIterator]` for stream
- [ ] ⚫️ Separate `api._ping()` into own module
- [ ] 💪 If HTTP 429, respect `Retry-After` response header (instead of exponential backoff).
- [ ] ⚫️ Builtin filter
- [ ] 🏃 Allow offset requests (either set start page or define offset as items/pagesize)
- [ ] ⚫️ "Revivable" smart requests.
- [ ] ⚫️ Allow other formats than text in smartRequest
- [ ] 🏃 Give users control over what to cache in smartRequest
- [ ] ⚫️ Expand getFetchSafeOptions in smartRequest

<br/>
<br/>

---

<br/>

## Tips for understanding the docs
<details>
  <summary>Click to expand</summary>

  Methods are described as such:
  ##### <code>methodName (_type_: argument) -> returnValue</code>
  Typing is not enforced, but for clarity.
  When a method has no (explicit) return value, it is omitted in the description:
  ##### <code>methodName (_type_: argument)</code>
  Optional arguments are suffixed with a `?`:
  ##### <code>methodName (_type_: optionalArgument?)</code>
  When a method returns a *Promise*, the value of its fulfillment is denoted between angled brackets `< >`:
  ##### <code>methodName () -> promise\<fulfillmentValue\></code>
</details>

<br/>
<br/>
<br/>

---

<br/>

## Technologies
⚠️ This wrapper was built for the client side. Server-side querying will be supported in a later version.

Interfacing with the API can be done in several ways. This is to facilitate the coding style of everyone while using the wrapper.

<br/>
<br/>

### Simple Promise (Native promises)
To use the API as some sort of `fetch` request, use the method `createPromise`, which will return a Promise that resolves to an array of responses.

#### How to use
To create a Promise through the wrapper, you simply call its method `createPromise`, which will return a promise that  that resolves to an array of responses. This has no special methods. [Refer to the Promise specification for more information.](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)

An example:
```js
//Imagine the functions toJson, cleanJSON and
//renderToDocument exist, and do what their
//name says.
const requests = await api.createPromise("endpoint/query");
requests
  .then(responses => {
    const mapped = responses.map(toJSON);
    return Promise.all(mapped);
  }).then(jsons => {
    const cleaned = responses.map(cleanJSON);
    return Promise.all(cleaned);
  }).then(cleanJsons => {
    cleanJsons.forEach(renderToDocument);
  });
```

<br/>
<br/>

### Promise streaming (Concurrency)
A _PromiseStream_ is a class that allows the "piping" of promises through functions. It is not like a Node Stream, since those require you to pipe into another stream. For those who understand streams, they are almost the same, just with functions. For those who do not know streams, let me introduce to you the wonderful world of streams! 😍

#### How to use
To create a PromiseStream through the wrapper, you simply call its method `createStream`, which will return a promise that resolves into a new PromiseStream. The stream has several methods:

##### <code>PromiseStream.prepend (*any[]:* ...values) -> PromiseStream</code>
Inserts values at the beginning of the stream. `values` do not have to be promises, the stream will internally convert all values to promises.

##### <code>PromiseStream.append (*any[]:* ...values) -> PromiseStream</code>
Inserts values at the end of the stream. `values` do not have to be promises, the stream will internally convert all values to promises.

##### <code>PromiseStream.insert (*number*: index?, *any[]:* ...values) -> PromiseStream</code>
Inserts values into the stream at `index`. `values` do not have to be promises, the stream will internally convert all values to promises. If `index` is not provided, it will be treated as `values`.

##### <code>PromiseStream.pipe (*function:* through) -> PromiseStream</code>
⚠️ _Does not pipe in order!_

Runs a function `through` for every resolved promise in the stream. Accepts both synchronous and asynchronous functions. Returns a new stream filled with promises that resolve to the value of `through`, so you can chain them (and use previous values).

An example:
```js
//Imagine the functions toJson, cleanJSON and
//renderToDocument exist, and do what their
//name says.
const stream = await api.createStream("endpoint/query");
stream
  .pipe(toJSON)
  .pipe(cleanJSON)
  .pipe(renderToDocument);
```

##### <code>PromiseStream.pipeOrdered(*function:* through) -> PromiseStream</code>
Runs a function `through` for every resolved promise in the stream, waiting for each previous resolvement. Accepts both synchronous and asynchronous functions. Returns a new stream filled with promises that resolve to the value of `through`, so you can chain them (and use previous values).

##### <code>PromiseStream.all () -> Promise<Any[]></code>
Shorthand for calling `Promise.all(stream.promises)`.

##### <code>PromiseStream.catch (*function:* handler) -> PromiseStream</code>
Adds a `.catch()` to every promise to allow for individual error handling. If you just want to handle all errors at once, use `.all().catch()`.

<br/>
<br/>

### Asynchronous iterator (Consecutiveness)
An iterator is a protocol used in JavaScript to iterate over enumerable objects. If that makes no sense to you, I mean things like arrays. You can loop (e.g. _iterate_) over those.

However, arrays have synchronous iterators. That means they do not `await` the values inside, so you cannot use them for promises.

But don't fret! I've made a custom asynchronous iterator for you! Simply call the API's method `createIterator`, which will return a promise that resolves into an asynchrounous array iterator. How to use it? Let me show you:

#### How to use

##### <code>for await ... of ...</code>
Because the iterator is asynchronous, you can use it within a `for await of` loop. If you have no idea what that means, take a look:

```js
//Imagine the functions toJson, cleanJSON and
//renderToDocument exist, and do what their
//name says.
const iterator = await api.createIterator("endpoint/query");
for await (const response of iterator) {
  const json = toJSON(response);
	const cleanedJSON = cleanJSON(json);
	renderToDocument(cleanedJSON);
}
```
This will do the same as [this PromiseStream example](#codepipefunction-throughcode).

<br/>
<br/>

### "Smart" Requests
A smart request is a request that retries 4 times ([implementing exponential backoff](https://developers.google.com/analytics/devguides/reporting/core/v3/errors#backoff)), but only if the reason of failure is not a fatal one (i.e. "*userRateLimitExceeded*", etc...).

This means that there will be a greater chance of recovering from (accidental) rate limit exceedances or internal server errors.

Besides that, it will use `localStorage` to cache responses by url, so later smart requests can check if their provided url was already cached. Blazingly fast 🔥!

#### How to use
You should not have to use a SmartRequest directly, since this wrapper uses them under the hood. You could use them _standalone_ for other purposes though. You can make use of the following methods:

##### <code>smartRequest(_url_: url, _object_: options?) -> Promise\<response\></code>
Sends out a fetch request that retries `options.maxTries` (defaults to `5`) times if possible. If a fatal error occured, or the maximum amount of tries was exceeded, the promise rejects with an error. If all went well, it will cache the result from url in localStorage with the key of `url`, and resolve with a response.

<br/>
<br/>

---

<br/>

## License
Licensed under MIT - Copyright © 2019 [maanlamp](https://github.com/maanlamp)