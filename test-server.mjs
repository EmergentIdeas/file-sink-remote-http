import FileSink from "file-sink"
import FileSinkServer from "file-sink-server"
import setup from "./initialize-webhandle-component.mjs"

export default async function setupServer(webhandle) {
	webhandle.development = true
	let manager = await setup(webhandle)
	let testDataSink = new FileSink(webhandle.sinks.project.path + '/test-data')
	
	let sinkRouter = webhandle.createRouter()
	let testDataServer = new FileSinkServer(testDataSink, {
	})
	testDataServer.addToRouter(sinkRouter)
	webhandle.routers.primary.use('/test-data', sinkRouter)

}



