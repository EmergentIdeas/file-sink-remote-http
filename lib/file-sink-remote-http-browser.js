const FileSinkRemoteHttp = require('./file-sink-remote-http')
const EventEmitter = require('@webhandle/minimal-browser-event-emitter').default

class FileSinkRemoteHttpBrowser extends FileSinkRemoteHttp {
	/**
	 * The url at the root of the file sink
	 * @param {string} path 
	 */
	constructor(path) {
		super(path)
	}

	async _read(combined, headers = {}) {
		let p = new Promise(async (resolve, reject) => {
			try {
				let response = await fetch(combined)
				if (response.status == 404) {
					return reject()
				}

				let buf = await response.arrayBuffer()
				resolve(Buffer.from(buf))
			}
			catch (e) {
				reject(e)
			}
		})

		return p
	}
	_readStream(combined, pass, headers = {}) {
		this._read(combined).then(data => {
			pass.end(Buffer.from(data), () => {
				pass.emit('close')
			})
		})
		.catch(err => {
			pass.emit('error', err)
		})
	}

	async _write(combined, sendData, method, headers) {
		let response = await fetch(combined, {
			method: method,
			body: sendData,
			headers: headers
		})
		if (response.status != 200) {
			throw new Error()
		}
	}

	async _getFullFileInfo(combined, headers = {}) {
		let response = await fetch(combined)
		if(response.status != 200) {
			throw new Error()
		}
		return await response.json()
	}

	async _createHash(combined, headers = {}) {
		let response = await fetch(combined)
		if(response.status != 200) {
			throw new Error()
		}
		return await response.text()
	}
	

	async _rm(combined, headers = {}) {
		let response = await fetch(combined, {
			method: 'DELETE',
			headers
		})

		if(response.status != 200) {
			throw new Error()
		}
		return await response.text()
	}
	
	async _mkdir(combined, headers = {}) {
		let response = await fetch(combined, {
			method: 'PUT',
			headers: {
				'File-Type': 'directory'
			}
		})

		if(response.status != 200) {
			throw new Error()
		}
	}
	
	/**
	 * Okay, seems a little trivial, but I want to be able to use the find code
	 * with other file-sink compatible storage systems on the browser for which
	 * I do NOT want to drag the entire EventEmitter code.
	 * @returns An EventEmitter
	 */
	_createEventEmitter() {
		return new EventEmitter()
	}

	_find(combined, headers = {}, options = {}) {
		let events = this._createEventEmitter()
		let params = new URLSearchParams(options)
		
		async function run() {
			let url = combined + '?' + params.toString()
			let response = await fetch(url, {
				method: 'GET'
			})
			if(response.status != 200) {
				events.emit('error', new Error())
			}
			else {
				let result = await response.text()
				let lines = result.split('\n').filter(line => !!line)
				for(let line of lines) {
					if(typeof line === 'string') {
						events.emit('data', JSON.parse(line))
					}
					else {
						events.emit('data', line)
					}
				}
			}

			events.emit('done')
		}
		
		run()
		return events
	}
	

}

module.exports = FileSinkRemoteHttpBrowser