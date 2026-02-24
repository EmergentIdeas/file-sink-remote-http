import FileSinkServer from 'file-sink-server'
import FileSink from "file-sink"
import props from "../test-lib/test-properties.js"

import Sink from "../lib/file-sink-remote-http-browser.js"

import addBasicCases from '../test-lib/basic-test-cases.mjs'
import express from 'express'

import test from "node:test"
import assert from "node:assert"
import http from "http"

let app
let server



let sink = new FileSink('./test-data')
let fss = new FileSinkServer(sink)
app = express()
app.set('port', props.port)
server = http.createServer(app)
server.listen(props.port)

let router = express.Router()
fss.addToRouter(router)

app.use(props.dataPath, router)

app.use((err, req, res, next) => {
	res.status(err.status)
	res.end()
})

let sinkPath = `http://localhost:${props.port}${props.dataPath}`
function getSink() {
	return new Sink(sinkPath)
}
await addBasicCases(props, Sink, test, assert)

await test('buffer test', async (t) => {
	await t.test("a positional write of buffers", async function () {
		let filename = 'data3.txt'
		let s = getSink()
		try {

			await s.write(filename, '')
			await s.write(filename, Buffer.alloc(10, 2), {
				position: 10
			})
			await s.write(filename, Buffer.from([1]), {
				position: 1
			})

			let data = await s.read(filename)
			assert.equal(data.length, 20, "Expected length to be 20")
			assert.equal(data[1], 1)
			for (let i = 10; i < 20; i++) {
				assert.equal(data[i], 2)
			}
			s.rm(filename)
		}
		catch (err) {
			throw new Error(err)
		}
	})

})

server.close()