class Proclet {

	constructor(func) {
		this._func = func;
		this._lazyChild = [];
		this._childHandlers = [];
	}

	get child() {
		return {
			on: (function (event, callback) {
				this._childHandlers[event] = callback;
				return this;
			}).bind(this)
		}
	}

	get parent() {
		return this;
	}

	on (event, callback) {
		if (this._child) {
			this._child.on(event, callback);
		} else {
			this._lazyChild.push({event: event, callback: callback.bind(this)});
		}
		return this;
	}

	/*clear (event) {
		if (this._child) {
			this._child.removeAllListeners(event);
		} else {
			this._lazyChild = this._lazyChild.filter(e => event !== undefined ? e.event !== event : false);
		}
		return this;
	}*/

	send (message) {
		this._child.send(message);
	}

	run() {
		const os = require('os'),
			fs   = require('fs'),
			util = require('util'),
			fork = require('child_process').fork,
			hash = require('crypto').createHash('sha512');

		const funcDef =
			`const $$__run = function () {
				return (${this._func.toString()})()
			};

			$$__run.onMessage = (function(message) {
				return (${(this._childHandlers['message'] || function(){}).toString()})(message)
			}).bind($$__run);

			$$__run.close = function (code = 0) {
				process.exit(code);
			};

			$$__run.send = function (message) {
				process.send(message);
			};

			process.on('uncaughtException', function (error) {
				process.send({ 'error': { name: error.name, stack: error.stack } });
				process.exit(1);
			});

			process.on('message', function (message) {
				$$__run.onMessage.call($$__run, message);
			});

			$$__run.call($$__run);`;

		hash.update(funcDef);

		const childPath = `${os.tmpdir()}/proclet_${hash.digest('hex')}.js`;

		if (!fs.existsSync(childPath)) {
			fs.writeFileSync(childPath, funcDef);
		}

		this._child = fork(childPath, [], { stdio: ['pipe', 'pipe', 'pipe', 'ipc'] });

		for (let handler of this._lazyChild) {
			this._child.on(handler.event, handler.callback);
		}

		this._lazyChild = [];

		return this;
	}

}

exports.Proclet = Proclet;