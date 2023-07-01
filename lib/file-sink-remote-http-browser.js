const FileSinkRemoteHttp = require('./file-sink-remote-http')

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
	
	

}

module.exports = FileSinkRemoteHttpBrowser