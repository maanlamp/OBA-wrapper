export default class PromiseStream {
	constructor (array = []) {
		this.promises = this._promisify(array);
	}

	_promisify (values) {
		return values.map(item => {
			return (item instanceof Promise) ? item : Promise.resolve(item);
		});
	}

	prepend (...values) {
		this.promises.unshift(...this._promisify(values));
		return this;
	}

	append (...values) {
		this.promises.push(...this._promisify(values));
		return this;
	}

	insert (position, ...values) {
		if (values.length === 0) return this.append(position);
		this.promises.splice(index, 0, ...values);
		return this;
	}

	pipe (callback) { //.then everything, not waiting for previous, not passing val of prev cb
		this.promises = this.promises
			.map((promise, index, source) => promise
				.then(value => callback(value, index, source)));

		return this;
	}

	pipeOrdered (callback) { //.then everything, waiting for previous, not passing val of prev cb
		this.promises = this.promises.reduce((acc, promise, index, source) => {
			const prev = acc[acc.length - 1];
			return [...acc, prev.then(async () => await callback(await promise, index, source))];
		}, [Promise.resolve()]);

		return this;
	}

	all () {
		return Promise.all(this.promises);
	}

	catch (callback) {
		this.promises = this.promises
			.map((promise, index, source) => promise
				.catch(async error => await callback(error, index, source)));

		return this;
	}
}