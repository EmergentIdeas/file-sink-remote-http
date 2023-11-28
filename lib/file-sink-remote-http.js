const { PassThrough } = require('stream')

const pathTools = require('path')
const filog = require('filter-log')
const addCallbackToPromise = require('add-callback-to-promise')

class FileSinkRemoteHttp {

	/**
	 * The url at the root of the file sink
	 * @param {string} path 
	 */
	constructor(path) {
		this.path = path
		if (!this.path.endsWith('/')) {
			this.path = this.path + '/'
		}
		this.log = filog('file-sink-remote-http')
	}

	_createCombinedPath(path) {
		if (path.startsWith('/')) {
			path = path.substring(1)
		}
		return this.path + path
	}

	_convertToBinary(data) {
		if (typeof data == 'string') {
			return Buffer.from(data)
		}

		return data
	}

	_getFirstFunction(args) {
		let newArgs = [...args]

		for (let i = 2; i < newArgs.length; i++) {
			let item = newArgs[i]
			if (typeof item == 'function') {
				return item
			}
		}
		return null
	}

	_getOptions(args) {
		let newArgs = [...args]

		for (let i = 2; i < newArgs.length; i++) {
			let item = newArgs[i]
			if (typeof item == 'object') {
				return item
			}
		}
		return null
	}
	
	async _read(combined, headers = {}) {
		throw new Error('must implement')
	}

	/**
	 * Reads data from a file
	 * @param {string} path The path of the file within the sink
	 * @param {function} [callback] An optional callback. If specified, 
	 * it will be added to the promise chain.
	 * @returns A promise which resolves to data from the file, a Buffer
	 */
	async read(path, callback) {
		let combined = this._createCombinedPath(path)
		let p = this._read(combined)
		return addCallbackToPromise(p, callback)
	}

	_readStream(combined, pass, headers = {}) {
		throw new Error('must implement')
	}
	/**
	 * Creates a file read stream
	 * 
	 * @param {string} path The path of the file within the sink
	 * @returns An stream object
	 */
	readStream(path) {
		let combined = this._createCombinedPath(path)
		let pass = new PassThrough()
		this._readStream(combined, pass, null)
		return pass
	}
	
	async _write(combined, sendData, method, headers) {
		throw new Error('must implement')
	}

	/**
	 * Writes data to a file.
	 * 
	 * 
	 * @param {string} path 
	 * @param {string | Buffer | TypedArray | DataView} data 
	 * @param {object} options Options, including those normally associated with fs.writeFile
	 * @param {object} options.offset Offset into the data
	 * @param {object} options.length The length of the data to write
	 * @param {object} options.position Position within the file
	 * @param {function} [callback] An optional callback. If specified, 
	 * it will be added to the promise chain.
	 * @returns A promoise which resolves null
	 */
	async write(path, data) {
		let combined = this._createCombinedPath(path)
		let callback = this._getFirstFunction(arguments)
		let options = this._getOptions(arguments) || {}

		let headers = {
			'Content-Type': 'application/octet-stream'
		}
		let method = 'PUT'
		if (options.position) {
			headers.Position = options.position
			method = 'PATCH'
		}

		let sendData = this._convertToBinary(data)
		if ((options.length || options.offset) && Buffer.isBuffer(sendData)) {
			sendData = Buffer.from(sendData, options.offset || 0, options.length)
		}

		let p = this._write(combined, sendData, method, headers)
		return addCallbackToPromise(p, callback)
	}
	
	async _getFullFileInfo(combined, headers = {}) {
		throw new Error('must implement')
	}

	/**
	 * Get the details for a file, including the children if the path points to
	 * a directory.
	 */
	async getFullFileInfo(path, callback) {
		let combined = this._createCombinedPath(path)

		if (!combined.endsWith('/')) {
			combined += '/'
		}
		combined += '$info'
		let p = this._getFullFileInfo(combined)
		return addCallbackToPromise(p, callback)
	}
	
	async _createHash(combined, headers = {}) {
		throw new Error('must implement')
	}

	createHash(path) {
		let combined = this._createCombinedPath(path)

		if (!combined.endsWith('/')) {
			combined += '/'
		}
		combined += '$hash'
		
		return this._createHash(combined)
	}
	
	async _rm(combined, headers = {}) {
		throw new Error('must implement')
	}

	/**
	 * Removes a file or directory
	 * @param {string} path 
	 * @param {function} [callback]
	 * @param {object} [options]
	 * @param {object} [options.recursive] If true will delete a directory and its contents (true by default)
	 * @returns 
	 */
	async rm(path) {
		let combined = this._createCombinedPath(path)
		let callback = this._getFirstFunction(arguments)
		let options = this._getOptions(arguments) || {}

		options = Object.assign({
			recursive: true
		}, options)

		let headers = {
			Recursive: 'true'
		}
		if(!options.recursive) {
			headers.Recursive = 'false'
		}

		let p = this._rm(combined)
		return addCallbackToPromise(p, callback)
	}
	
	async _mkdir(combined, headers = {}) {
		throw new Error('must implement')
	}

	/**
	 * Makes a directory
	 * @param {string} path 
	 * @returns a promise 
	 */
	async mkdir(path) {
		let combined = this._createCombinedPath(path)

		return this._mkdir(combined)
	}

	/**
	 * Okay, seems a little trivial, but I want to be able to use the find code
	 * with other file-sink compatible storage systems on the browser for which
	 * I do NOT want to drag the entire EventEmitter code.
	 * @returns An EventEmitter
	 */
	_createEventEmitter() {
		throw new Error('must implement')
	}

	/**
	 * Finds files and directories a bit like the unix `find` command.
	 * 
	 * @param {object} options
	 * @param {string} options.startingPath The relative path within the sink to begin looking.
	 * @param {boolean} options.file Set to true if paths which represent files should be emitted (true by default)
	 * @param {boolean} options.directory Set to true if paths which represent directories should be emitted (true by default)
	 * @param {string | RegExp | function | async function} options.namePattern A test for the name of the file/directory.
	 * If a function it must return true for the path to be emitted. If an async function, it must resolve to true for the
	 * path to be emitted. If a regex, the `test` function must return true when passed the name. If a string, it will be
	 * passed to `new RegExp()` to create a regular expression.
	 * @param {string | RegExp | function | async function} options.pathPattern A test for the path of the file/directory.
	 * Works like namePattern except that the relative path value of the item is used instead of just the name.
	 * @returns An EventEmitter which emits `data` and `done` events.
	 * The `data` events have an object which is the same as returned from getFullFileInfo
	 */
	find(options = {}) {
		let {
			startingPath
		} = options = Object.assign({
			file: true
			, directory: true
			, startingPath: ""
		} , options)

		let combined = this._createCombinedPath(startingPath)
		if(!combined.endsWith('/')) {
			combined += '/'
		}
		combined += '$find'
		delete options.startingPath
		
		
		let nameTest
		let pathTest
		if(typeof options.namePattern === 'function' || typeof options.pathPattern === 'function') {
			// we don't want to send these, but we'll need them for later
			if(typeof options.namePattern === 'function') {
				nameTest = options.namePattern
				delete options.namePattern
			}
			if(typeof options.pathPattern === 'function') {
				pathTest = options.pathPattern
				delete options.pathPattern
			}
		}

		let events = this._find(combined, null, options)
		
		// Passing string versions of regexp work pretty well. However, passing functions won't work and we have
		// to do that here.
		if(nameTest || pathTest) {
			// we'll need to filter the data after we get it
			let orgEvents = events
			events = this._createEventEmitter()
			
			orgEvents.on('data', async data => {
				if(nameTest) {
					let result = nameTest(data.name)
					if(result instanceof Promise) {
						result = await result
					}
					if(!result) {
						return
					}
				}
				if(pathTest) {
					let result = pathTest(data.relPath)
					if(result instanceof Promise) {
						result = await result
					}
					if(!result) {
						return
					}
				}
				events.emit('data', data)
			})
			
			orgEvents.on('done', () => {
				events.emit('done')
			})

		}
		
		return events
	}

	/**
	 * Finds files and directories a bit like the unix `find` command.
	 * 
	 * @param {object} options See options for `find`.
	 * @returns A promise which resolves to an array of strings of relative paths
	 * which match the conditions given in the options.
	 */
	async findPaths(options) {
		return new Promise((resolve, reject) => {
			let items = []

			try {
				let events = this.find(options)
				let rejected = false

				events.on('data', info => {
					items.push(info.relPath)
				})
				.on('done', () => {
					if(!rejected) {
						resolve(items)
					}
				})
				.on('error', (err) => {
					rejected = true
					reject(err)
				})
			}
			catch(e) {
				console.error(e)
			}
		})
	}
}

module.exports = FileSinkRemoteHttp
