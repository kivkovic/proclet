const {Proclet} = require('./index.js');

const proclet = new Proclet(() => {
	/*
	 * child process worker function
	 */
	setTimeout(() => this.send('Hello'), 500);
});

proclet.child.on('message', message => {
	this.send('Message from parent process: ' + message);
	
	if (message.indexOf('Hi') === 0) {
		this.send('Let\'s not get stuck in a loop, shall we?');
	} else if (message.toLowerCase() === '/close') {
		this.send('Child closing');
		this.close(0);
	}
});

proclet.parent.on('message', message => {
	console.log('Message from subprocess:', message);

	if (message.indexOf('Hello') === 0) {
		proclet.parent.send('Hi!');
	}
});

proclet.parent.on('error', error => {
	console.error('Error from subprocess', { name: error.name, message: error.message, stack: error.stack });
})

proclet.parent.on('exit', message => {
	clearInterval(global.mainLoop);
});

proclet.run();

setTimeout(() => proclet.parent.send('/close'), 3000);

global.mainLoop = setInterval(() => {}, Number.POSITIVE_INFINITY);

