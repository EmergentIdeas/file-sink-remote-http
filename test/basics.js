const FileSinkServer = require('file-sink-server')
const FileSink = require('file-sink')
let props = require('../test-lib/test-properties')

let Sink = require('../lib/file-sink-remote-http-axios')

const addBasicCases = require('../test-lib/basic-test-cases')

let app
let server

describe("setup", function () {

	const express = require('express')
	let sink = new FileSink('./test-data')
	let fss = new FileSinkServer(sink)
	it("setup server", function () {
		app = express()
		app.set('port', props.port)
		let http = require('http');
		server = http.createServer(app)
		server.listen(props.port)

		let router = express.Router()
		fss.addToRouter(router)

		app.use(props.dataPath, router)

		app.use((err, req, res, next) => {
			res.status(err.status)
			res.end()
		})
	})
})

addBasicCases(props, Sink)

describe("teardown", function () {

	it("shutdown", function () {
		server.close()
	})
})