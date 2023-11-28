const FileSinkRemoteHttp = require('./file-sink-remote-http')
const axios = require('axios')
const EventEmitter = require('events')

class FileSinkRemoteHttpNode extends FileSinkRemoteHttp {
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
				let response = await axios.get(combined, {
					responseType: 'arraybuffer'
				})

				resolve(Buffer.from(response.data))
			}
			catch (e) {
				reject(e)
			}
		})

		return p
	}

	async _readStream(combined, pass, headers = {}) {
		axios.get(combined, {
			responseType: 'stream'
		}).then(response => {
			response.data.pipe(pass)
		})
			.catch(err => {
				pass.emit('error', err)
			})
	}

	async _write(combined, sendData, method, headers) {
		let response = await axios({
			method: method,
			url: combined,
			data: sendData,
			headers: headers
		})
	}

	async _getFullFileInfo(combined, headers = {}) {
		let response = await axios({
			method: 'get',
			url: combined
		})
		return response.data
	}

	async _createHash(combined, headers = {}) {
		let response = await axios({
			method: 'get',
			url: combined
		})
		return response.data
	}
	
	
	async _rm(combined, headers = {}) {
		return axios({
			method: 'delete',
			url: combined,
			headers
		})
	}

	async _mkdir(combined, headers = {}) {
		let response = await axios({
			method: 'put',
			url: combined,
			headers: {
				'File-Type': 'directory'
			}
		})
	}

	_find(combined, headers = {}, options = {}) {
		let events = this._createEventEmitter()
		let params = new URLSearchParams(options)
		
		async function run() {
			let response = await axios({
				method: 'get',
				url: combined + '?' + params,
				headers: headers
			})
			let result = response.data
			// There's a bit of axios behavior here to take care of.
			// The type of this response is jsonl+json, which means there
			// should be one JSON object per line. If there are multiple lines
			// axios gives us the text, but if there's only one line it gives
			// us the object.
			if(typeof result === 'string') {
				let lines = result.split('\n').filter(line => !!line)
				for(let line of lines) {
					let data = JSON.parse(line)
					events.emit('data', data)
				}
			}
			if(typeof result === 'object') {
				if(Array.isArray(result)) {
					// This isn't a current axios behavior so far as I know.
					// However, if it understood jsonl as a format, this is likely
					// what it would do, so let's add a little future protection
					for(let line of result) {
						if(typeof line === 'string') {
							events.emit('data', JSON.parse(line))
						}
						else {
							events.emit('data', line)
						}
					}
				}
				else {
					// this is the other common case where we have only one result and
					// axios parses it for us.
					events.emit('data', result)
				}
			}
			events.emit('done')
		}
		
		run()
		return events
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
}

module.exports = FileSinkRemoteHttpNode