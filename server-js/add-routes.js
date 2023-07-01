const path = require('path')
const express = require('express');
const webhandle = require('webhandle');
const FileSink = require('file-sink')
const FileSinkServer = require('file-sink-server')

const filog = require('filter-log')
let log

module.exports = function(app) {
	log = filog('unknown')
	
	
	let testDataSink = new FileSink(webhandle.sinks.project.path + '/test-data')
	
	let sinkRouter = express.Router()
	let testDataServer = new FileSinkServer(testDataSink, {
	})
	testDataServer.addToRouter(sinkRouter)
	app.use('/test-data', sinkRouter)
	


}

