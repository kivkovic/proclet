const {Proclet} = require('./index.js');

const proclet = new Proclet(() => {
	/*
	 * child process worker function
	 */
	setTimeout(() => this.send('Hello'), 500);
});

proclet.child.on('message', message => {
	this.send('Message from parent process: ' + message.payload);
	if (message.payload.indexOf('Hi') === 0) {
		this.send('Let\'s not get stuck in a loop, shall we?');
	}
});

proclet.child.on('close', message => {
	this.send('Child closing');
});

proclet.parent.on('message', message => {
	console.log('Message from subprocess:', message.payload);

	if (message.payload.indexOf('Hello') === 0) {
		proclet.parent.send({type: 'message', 'payload': 'Hi!'});
	}
});

proclet.parent.on('error', error => {
	console.error('Error from subprocess', { name: error.name, message: error.message, stack: error.stack });
})

proclet.parent.on('exit', message => {
	clearInterval(global.mainLoop);
});

proclet.run();

setTimeout(() => proclet.parent.send({ type: 'close' }), 3000);

global.mainLoop = setInterval(() => {}, Number.POSITIVE_INFINITY);

