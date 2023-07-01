const FileSinkRemoteHttp = require('./file-sink-remote-http')
const axios = require('axios')

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
}

module.exports = FileSinkRemoteHttpNode