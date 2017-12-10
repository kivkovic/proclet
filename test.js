const {Proclet} = require('./index.js');

const proclet = new Proclet(() => {
	/*
	 * child process worker function
	 */
	setTimeout(() => this.send('Hello'), 500);
});

proclet.child.on('message', message => {
	this.send('Child received a message');
});

proclet.child.on('close', message => {
	this.send('Child closing');
});

proclet.parent.on('message', message => {
	console.log('Message from subprocess', message.type, message.payload);
});

proclet.parent.on('error', error => {
	console.error('Error from subprocess', { name: error.name, message: error.message, stack: error.stack });
})

proclet.parent.on('exit', message => {
	clearInterval(global.mainLoop);
});

proclet.run();

setTimeout(() => proclet.parent.send({ type: 'close' }), 2000);

global.mainLoop = setInterval(() => {}, Number.POSITIVE_INFINITY);

