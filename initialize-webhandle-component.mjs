import createInitializeWebhandleComponent from "@webhandle/initialize-webhandle-component/create-initialize-webhandle-component.mjs"
import ComponentManager from "@webhandle/initialize-webhandle-component/component-manager.mjs"
import path from "node:path"

let initializeWebhandleComponent = createInitializeWebhandleComponent()

initializeWebhandleComponent.componentName = 'file-sink-remote-http'
initializeWebhandleComponent.componentDir = import.meta.dirname
initializeWebhandleComponent.defaultConfig = {
	"publicFilesPrefix": "/file-sink-remote-http/files"
	, "provideResources": true
}

initializeWebhandleComponent.setup = async function(webhandle, config) {
	let manager = new ComponentManager()
	manager.config = config
	
	manager.provideExternalResources = function(externalResourceManager) {

		let resource = {
			mimeType: 'application/javascript'
			, url: config.publicFilesPrefix + '/file-sink-remote-http.js'
			, name: 'file-sink-remote-http'
			, resourceType: 'module'
			, cachable: webhandle.development ? false : true
		}
		externalResourceManager.provideResource(resource)
	}
	
	if(config.provideResources) {
		webhandle.routers.preDynamic.use((req, res, next) => {
			manager.provideExternalResources(res.locals.externalResourceManager)
			next()
		})
	}
	
	let dir = 'resources'
	manager.staticPaths.push(
		webhandle.addStaticDir(
			path.join(initializeWebhandleComponent.componentDir, dir),
			{
				urlPrefix: config.publicFilesPrefix
				, fixedSetOfFiles: true
			}
		)
	)

	return manager
}

export default initializeWebhandleComponent
