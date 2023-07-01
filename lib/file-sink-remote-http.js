let axios;
let isBrowser = typeof window != 'undefined'
if(!isBrowser) {
	axios = require('axios')
}
const { PassThrough } = require('stream')

const pathTools = require('path')
const filog = require('filter-log')
const addCallbackToPromise = require('add-callback-to-promise')

class FileSinkRemoteHttp {

	/**
	 * The directory at the root of the file sink
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

	/**
	 * Reads data from a file
	 * @param {string} path The path of the file within the sink
	 * @param {function} [callback] An optional callback. If specified, 
	 * it will be added to the promise chain.
	 * @returns A promise which resolves to data from the file, a Buffer
	 */
	async read(path, callback) {
		let p = new Promise(async (resolve, reject) => {
			let combined = this._createCombinedPath(path)
			try {
				if(isBrowser) {
					let response = await fetch(combined)
					if(response.status == 404) {
						return reject()
					}
					
					let buf = await response.arrayBuffer()
					resolve(Buffer.from(buf))
				}
				else {
					let response = await axios.get(combined, {
						responseType: 'arraybuffer'
					})

					resolve(Buffer.from(response.data))
				}
			}
			catch (e) {
				reject(e)
			}
		})
		return addCallbackToPromise(p, callback)
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
		if(isBrowser) {
			this.read(path).then(data => {
				pass.end(Buffer.from(data), () => {
					pass.emit('close')
				})
			})
			.catch(err => {
				pass.emit('error', err)
			})
		}
		else {
			axios.get(combined, {
				responseType: 'stream'
			}).then(response => {
				response.data.pipe(pass)
			})
			.catch(err => {
				pass.emit('error', err)
			})
		}

		return pass
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

		let p = new Promise(async (resolve, reject) => {
			try {
				if(isBrowser) {
					let response = await fetch(combined, {
						method: method,
						body: sendData,
						headers: headers
					})
					if(response.status != 200) {
						return reject()
					}
					resolve()
				}
				else {
					let response = await axios({
						method: method,
						url: combined,
						data: sendData,
						headers: headers
					})
					resolve()
				}
			}
			catch (e) {
				reject(e)
			}
		})

		return addCallbackToPromise(p, callback)
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

		let p = new Promise(async (resolve, reject) => {
			try {
				if(isBrowser) {
					let response = await fetch(combined)
					if(response.status != 200) {
						return reject()
					}
					resolve(await response.json())
				}
				else {
					let response = await axios({
						method: 'get',
						url: combined
					})
					resolve(response.data)
				}
			}
			catch (e) {
				reject(e)
			}
		})

		return addCallbackToPromise(p, callback)
	}

	createHash(path) {
		let combined = this._createCombinedPath(path)

		if (!combined.endsWith('/')) {
			combined += '/'
		}
		combined += '$hash'

		let p = new Promise(async (resolve, reject) => {
			try {
				if(isBrowser) {
					let response = await fetch(combined)
					if(response.status != 200) {
						return reject()
					}
					resolve(await response.text())
				}
				else {
					let response = await axios({
						method: 'get',
						url: combined
					})
					resolve(response.data)
				}
			}
			catch (e) {
				reject(e)
			}
		})

		return p
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

		let p
		if(isBrowser) {
			p = new Promise(async (resolve, reject) => {
				let response = await fetch(combined, {
					method: 'DELETE',
					headers
				})

				if(response.status != 200) {
					return reject()
				}
				resolve(await response.text())
			})
		}
		else {
			p = axios({
				method: 'delete',
				url: combined,
				headers
			})
		}
		return addCallbackToPromise(p, callback)
	}

	/**
	 * Makes a directory
	 * @param {string} path 
	 * @returns a promise 
	 */
	async mkdir(path) {
		let combined = this._createCombinedPath(path)

		if(isBrowser) {
			let p = new Promise(async (resolve, reject) => {
				let response = await fetch(combined, {
					method: 'PUT',
					headers: {
						'File-Type': 'directory'
					}
				})

				if(response.status != 200) {
					return reject()
				}
				resolve()
			})
			return p
		}
		else {
			let response = await axios({
				method: 'put',
				url: combined,
				headers: {
					'File-Type': 'directory'
				}
			})
			return response
		}
	}

}

module.exports = FileSinkRemoteHttp
