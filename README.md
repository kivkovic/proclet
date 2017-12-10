# proclet

A node package for running single functions as separate processes

## API

The `Proclet` class takes a function which will be run as a node child process:

```javascript
const proclet = new Proclet(() => {
    /*
     * child process worker function
     */
    setTimeout(() => this.send('Hello'), 500);
});
```

The process is started by calling:
```
proclet.run();
```

The object exposes two properties: `.child` and `.parent`.

### `.child`

This property refers to the child process. A single method is exposed on this object:

```
.on(event_name, callback)
```

Currently, the only monitored event is `message`, indicating a message has been received from the parent process. The callback is bound to a context providing two methods:
 - `this.close(code = 0)` - closes the child process with the specified exit code
 - `this.send(message)` - sends a message to the parent process


### `.parent`

This property refers to the parent process. Two methods are exposed on this object:

```
.on(event_name, callback)
```
Monitors three events:
- `message` - indicates a message has been received from the child process
- `error` - indicates an error has been received from the child process
- `exit` - indicates the child process has terminated

```
.send(message)
```
Sends a message to the child process

## Example

```javascript

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
```
