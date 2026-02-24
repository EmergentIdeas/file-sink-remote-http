
let time = new Date().getTime()
let msg = 'this is a test: ' + time

export default async function addBasicCases(props, Sink, test, assert) {
	let sinkPath = `http://localhost:${props.port}${props.dataPath}`
	function getSink() {
		return new Sink(sinkPath)
	}

	await test("data path", async (t) => {


		await t.test("a simple write", function () {
			let s = getSink()
			let p = new Promise((resolve, reject) => {
				s.write('data1.txt', msg, function (error) {
					if (error) {
						return reject(error)
					}
					return resolve()
				})
			})
			return p
		})

		await t.test("size of write", async function () {
			let s = getSink()
			let info = await s.getFullFileInfo('data1.txt')
			assert.equal(info.stat.size, msg.length)
		})


		await t.test("test remove", async function () {
			let p = new Promise((resolve, reject) => {
				let filename = 'data3.txt'
				let s = getSink()
				let f = async () => {
					try {
						await s.write(filename, '')
						let info = await s.getFullFileInfo(filename)
						assert.equal(info.stat.size, 0)

						await s.rm(filename)

						try {
							info = await s.getFullFileInfo(filename)
							reject(new Error(info))
						}
						catch (e) {
							// the file does not exist, so that should get an error
							resolve()
						}
					}
					catch (err) {
						console.log(err)
						reject(new Error(err))
					}
				}
				f()
			})
			return p
		})


		await t.test("a positional write", async function () {
			let filename = 'data2.txt'
			let s = getSink()
			try {

				await s.write(filename, '')
				await s.write(filename, 'b', {
					position: 10
				})
				await s.write(filename, 'a', {
					position: 1
				})

				let data = await s.read(filename)
				assert.equal(data.length, 11, "Expected length to be 11")
				assert.equal(data.slice(1, 2).toString(), 'a')
				assert.equal(data.slice(10, 11).toString(), 'b')
			}
			catch (err) {
				throw new Error(err)
			}
		})


		await t.test("create hash", async function () {
			let filename = 'data2.txt'
			let s = getSink()
			try {
				let hash = await s.createHash(filename)
				console.log(hash)

			}
			catch (err) {
				throw (new Error(err))
			}
		})

		await t.test("a simple write promise", async function () {
			let p = new Promise((resolve, reject) => {
				let s = getSink()
				s.write('data1.txt', msg).then(() => {
					resolve()
				}).catch(error => {
					return reject(error)
				})
			})
			return p
		})


		await t.test("a simple write await", async function () {
			let s = getSink()
			try {
				let result = await s.write('data1.txt', msg)
			}
			catch (err) {
				throw (new Error(err))
			}
		})


		await t.test("a simple read", async function () {
			let p = new Promise((resolve, reject) => {

				let s = getSink()
				s.read('data1.txt', function (error, data) {
					if (error) {
						return reject(error)
					}
					if (msg == data.toString()) {
						resolve()
					}
					else {
						reject(new Error('contents read did not match contents written'))
					}
				})
			})
			return p

		})

		await t.test("a simple promise read", async function () {
			let p = new Promise((resolve, reject) => {
				let s = getSink()
				s.read('data1.txt').then(data => {
					if (msg == data.toString()) {
						resolve()
					}
					else {
						reject(new Error('contents read did not match contents written'))
					}
				}).catch(err => {
					reject(new Error(err))
				})
			})
			return p
		})


		await t.test("a simple promise read failure", async function () {
			let p = new Promise((resolve, reject) => {
				let s = getSink()
				s.read('data1-does-not-exist.txt').then(data => {
					reject(new Error('this file should not exist'))
				}).catch(err => {
					resolve()
				})

			})
			return p
		})

		await t.test("a simple promise await read", async function () {
			let s = getSink()
			try {
				let data = await s.read('data1.txt')
				if (msg == data.toString()) {
				}
				else {
					throw (new Error('contents read did not match contents written'))
				}
			}
			catch (err) {
				throw (new Error(err))
			}
		})

		await t.test("a simple promise await read failure", async function () {
			let p = new Promise(async (resolve, reject) => {

				let s = getSink()
				try {
					let data = await s.read('data1-does-not-exist.txt')
					if (msg == data.toString()) {
						reject(new Error('file should not exist'))
					}
					else {
						reject(new Error('contents read did not match contents written'))
					}
				}
				catch (err) {
					// This is correct since the file shouldn't exist
					resolve()
				}
			})
			return p
		})


		await t.test("a stream read", async function () {
			let p = new Promise((resolve, reject) => {

				let s = getSink()
				try {
					let data = ''
					let stream = s.readStream('data1.txt')
					stream.on('data', (chunk) => {
						data += chunk
					})
					stream.on('close', () => {
						if (msg == data.toString()) {
							resolve()
						}
						else {
							reject(new Error('contents read did not match contents written'))
						}
					})
				}
				catch (error) {
					return reject(error)
				}
			})
			return p
		})


		await t.test("a stream read of a non-existent file", async function () {
			let p = new Promise((resolve, reject) => {
				let s = getSink()
				let triggeredError = false
				try {
					let data = ''
					let stream = s.readStream('data1-this-does-not-exist.txt')
					stream.on('data', (chunk) => {
						if (!triggeredError) {
							reject(new Error('should not have gotten data'))
							triggeredError = true
						}
					})
					stream.on('close', () => {
						if (!triggeredError) {
							reject(new Error('should not have gotten data'))
							triggeredError = true
						}
					})
					stream.on('error', (err) => {
						// we got an error, which is good, since this file does not exist
						resolve()
					})
				}
				catch (error) {
					return reject(error)
				}
			})
			return p
		})

		await t.test("delete non-existent file", async function () {
			let p = new Promise((resolve, reject) => {
				let s = getSink()
				try {
					let promise = s.rm('testfile4')
					promise.then((data) => {
						reject(new Error('we should have gotten an error'))
					})
						.catch(err => {
							resolve()
						})
				}
				catch (error) {
					return reject(error)
				}
			})
			return p
		})

		await t.test("a positional write of buffers", async function () {
			let filename = 'data3.txt'
			let s = getSink()
			try {

				await s.write(filename, '')
				await s.write(filename, Buffer.alloc(10, 2), {
					position: 10
				})
				await s.write(filename, Buffer.from([1]), {
					position: 1
				})

				let data = await s.read(filename)
				assert.equal(data.length, 20, "Expected length to be 20")
				assert.equal(data[1], 1)
				for (let i = 10; i < 20; i++) {
					assert.equal(data[i], 2)
				}
				s.rm(filename)
			}
			catch (err) {
				throw new Error(err)
			}
		})

		await t.test("a directory create", async function () {
			let p = new Promise((resolve, reject) => {
				let s = getSink()
				try {
					let promise = s.mkdir('testdir')
					promise.then(async (data) => {
						let info = await s.getFullFileInfo('testdir')
						assert.equal('testdir', info.name)
						resolve()
					})
				}
				catch (error) {
					return reject(error)
				}
			})
			return p
		})


		await t.test("find all paths", async function () {
			let p = new Promise((resolve, reject) => {
				let s = getSink()
				try {
					let promise = s.findPaths()
					promise.then((data) => {
						if (data.length == 5) {
							resolve()
						}
						else {
							reject(new Error('the directory did not contain the right number of files'))
						}
					})
				}
				catch (error) {
					return reject(error)
				}

			})
			return p
		})

		await t.test("find all data paths", async function () {
			let p = new Promise((resolve, reject) => {
				let s = getSink()
				try {
					let promise = s.findPaths({
						namePattern: 'data'
					})
					promise.then((data) => {
						if (data.length == 2) {
							resolve()
						}
						else {
							reject(new Error('the directory did not contain the right number of files'))
						}
					})
				}
				catch (error) {
					return reject(error)
				}
			})
			return p
		})



		await t.test("find all data paths with real regexp", async function () {
			let p = new Promise((resolve, reject) => {
				let s = getSink()
				try {
					let promise = s.findPaths({
						namePattern: /data/
					})
					promise.then((data) => {
						if (data.length == 2) {
							resolve()
						}
						else {
							reject(new Error('the directory did not contain the right number of files'))
						}
					})
				}
				catch (error) {
					return reject(error)
				}
			})
			return p
		})


		await t.test("find all data paths with real regexp (path)", async function () {
			let p = new Promise((resolve, reject) => {
				let s = getSink()
				try {
					let promise = s.findPaths({
						pathPattern: /data/
					})
					promise.then((data) => {
						if (data.length == 2) {
							resolve()
						}
						else {
							reject(new Error('the directory did not contain the right number of files'))
						}
					})
				}
				catch (error) {
					return reject(error)
				}
			})
			return p
		})


		await t.test("find all data paths with function", async function () {
			let p = new Promise((resolve, reject) => {
				let s = getSink()
				try {
					let promise = s.findPaths({
						namePattern: function (name) {
							return name.indexOf('data') > -1
						}
					})
					promise.then((data) => {
						if (data.length == 2) {
							resolve()
						}
						else {
							reject(new Error('the directory did not contain the right number of files'))
						}
					})
				}
				catch (error) {
					return reject(error)
				}
			})
			return p
		})


		await t.test("find all data paths with function", async function () {
			let p = new Promise((resolve, reject) => {
				let s = getSink()
				try {
					let promise = s.findPaths({
						namePattern: function (name) {
							return name.indexOf('data') > -1
						}
						, pathPattern: async function (name) {
							return name.indexOf('2') > -1
						}
					})
					promise.then((data) => {
						if (data.length == 1) {
							resolve()
						}
						else {
							reject(new Error('the directory did not contain the right number of files'))
						}
					})
				}
				catch (error) {
					return reject(error)
				}
			})
			return p
		})


		await t.test("find just directory paths", async function () {
			let p = new Promise((resolve, reject) => {
				let s = getSink()
				try {
					let promise = s.findPaths({
						file: false
					})
					promise.then((data) => {
						if (data.length == 1) {
							resolve()
						}
						else {
							reject(new Error('the directory did not contain the right number of files'))
						}
					})
				}
				catch (error) {
					return reject(error)
				}
			})
			return p
		})

		await t.test("a directory delete", async function () {
			let p = new Promise((resolve, reject) => {
				let s = getSink()
				try {
					let promise = s.rm('testdir')
					promise.then((data) => {
						resolve()
					})
						.catch(err => {
							reject(err)
						})
				}
				catch (error) {
					return reject(error)
				}

			})
			return p
		})


		await t.test("a directory read", function (done) {
			let p = new Promise((resolve, reject) => {
				let s = getSink()
				try {
					let promise = s.getFullFileInfo('')
					promise.then((data) => {
						if (data.accessUrl != sinkPath) {
							return reject(new Error('access url not set'))
						}
						for (let child of data.children) {
							if (child.accessUrl != sinkPath + '/' + child.name) {
								return reject(new Error('access url not set for children'))
							}
						}
						if (data.children.length == 4) {
							resolve()
						}
						else {
							reject(new Error('the directory did not contain the right number of files'))
						}
					})
				}
				catch (error) {
					return reject(error)
				}

			})
			return p
		})
	})
}
