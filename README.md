# File Sink Remote HTTP
A file sink which accesses files via RESTful HTTP verbs

## Why

I want to use something else I wrote, [FileSink](https://www.npmjs.com/package/file-sink), to abstract
away just a little bit of the file system interface. I want callers to be able to read and write "files"
without needing to know where, specifically, on disk they're writing to, or even what they're really writing
to. It could be a file system, http, AWS S3, indexeddb, mongodb, or whatever. The caller shouldn't need to
know how to connect to the underlying resource, how to encrypt/decrypt, or anything more than the relative
path.

This is the bridge between a browser side FileSink and one on the web server which reads/writes the local
file system.

While I have some specific uses in mind for this, it also makes it really easy just to provide RESTful access
to files.

## Install

```
npm install file-sink-remote-http
```

## Usage

On the server side:

```js
import fileSinkRemoteHttpSetup from "file-sink-remote-http/initialize-webhandle-component.mjs"
let fileSinkRemoteHttpManager = await fileSinkRemoteHttpSetup(webhandle)

```

On the client side:

```js
import {FileSinkRemoteHttp} from "file-sink-remote-http"
let sink = new FileSinkRemoteHttp(`http://localhost:3000/test-data`)
let msg = (await sink.read('data1.txt')).toString()

```



Use the file sink methods to read and write data.

```js
const Sink = require('file-sink-remote-http')
let sink = new Sink(`http://localhost:3000/test-data`)

async function test() {
	let msg = (await sink.read('data1.txt')).toString()
	console.log(msg)
}

test()
```
