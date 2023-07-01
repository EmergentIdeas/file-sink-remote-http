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

}

module.exports = FileSinkRemoteHttp
