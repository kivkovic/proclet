# proclet

A node package for running single functions as separate processes, wrapped in a simple API with event-based IPC messaging out of the box.

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

Behind the scenes, Proclet takes your function's source, wraps it in boilerplate and saves it to a temporary file, which is then started up as a separate node process. The filenames are based on a SHA512 hash of the worker function source, so multiple instatiations of an identical function will use the same temporary source file if it's available on disk.

The `Proclet` instance exposes two properties: `.child` and `.parent`.

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

All event handlers may be attached before or after running the `run` method.

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


// console.log output from parent process:
//
// Message from subprocess: Hello
// Message from subprocess: Message from parent process: Hi!
// Message from subprocess: Let's not get stuck in a loop, shall we?
// Message from subprocess: Message from parent process: /close
// Message from subprocess: Child closing

```
