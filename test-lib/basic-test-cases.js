
let time = new Date().getTime()
let msg = 'this is a test: ' + time
require('mocha')
const assert = require('chai').assert


function addBasicCases(props, Sink) {
	function getSink() {
		return new Sink(`http://localhost:${props.port}${props.dataPath}`)
	}
	describe("basic tests", function () {


		it("a simple write", function (done) {
			let s = getSink()
			s.write('data1.txt', msg, function (error) {
				if (error) {
					return done(error)
				}
				return done()
			})
		})
		it("size of write", async function () {
			let s = getSink()
			let info = await s.getFullFileInfo('data1.txt')
			assert.equal(info.stat.size, msg.length)
		})

		it("test remove", function (done) {
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
						done(new Error(info))
					}
					catch (e) {
						// the file does not exist, so that should get an error
						done()
					}
				}
				catch (err) {
					console.log(err)
					done(new Error(err))
				}
			}
			f()
		})

		it("a positional write", function (done) {
			let filename = 'data2.txt'
			let s = getSink()
			let f = async () => {
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
					done()
				}
				catch (err) {
					done(new Error(err))
				}
			}
			f()
		})

		it("a positional write of buffers", function (done) {
			let filename = 'data3.txt'
			let s = getSink()
			let f = async () => {
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
					done()
				}
				catch (err) {
					done(new Error(err))
				}
			}
			f()
		})
		it("create hash", function (done) {
			let filename = 'data2.txt'
			let s = getSink()
			let f = async () => {
				try {
					let hash = await s.createHash(filename)
					console.log(hash)

					done()
				}
				catch (err) {
					done(new Error(err))
				}
			}
			f()
		})
		it("a simple write promise", function (done) {
			let s = getSink()
			s.write('data1.txt', msg).then(() => {
				done()
			}).catch(error => {
				return done(error)
			})

		})

		it("a simple write await", function (done) {
			let s = getSink()
			let f = async () => {
				try {
					let result = await s.write('data1.txt', msg)
					done()
				}
				catch (err) {
					done(new Error(err))
				}
			}
			f()
		})

		it("a simple read", function (done) {
			let s = getSink()
			s.read('data1.txt', function (error, data) {
				if (error) {
					return done(error)
				}
				if (msg == data.toString()) {
					done()
				}
				else {
					done(new Error('contents read did not match contents written'))
				}
			})

		})

		it("a simple promise read", function (done) {
			let s = getSink()
			s.read('data1.txt').then(data => {
				if (msg == data.toString()) {
					done()
				}
				else {
					done(new Error('contents read did not match contents written'))
				}
			}).catch(err => {
				done(new Error(err))
			})
		})

		it("a simple promise read failure", function (done) {
			let s = getSink()
			s.read('data1-does-not-exist.txt').then(data => {
				done(new Error('this file should not exist'))
			}).catch(err => {
				done()
			})
		})

		it("a simple promise await read", function (done) {
			let f = async () => {
				let s = getSink()
				try {
					let data = await s.read('data1.txt')
					if (msg == data.toString()) {
						done()
					}
					else {
						done(new Error('contents read did not match contents written'))
					}
				}
				catch (err) {
					done(new Error(err))
				}
			}

			f()
		})

		it("a simple promise await read failure", function (done) {
			let f = async () => {
				let s = getSink()
				try {
					let data = await s.read('data1-does-not-exist.txt')
					if (msg == data.toString()) {
						done(new Error('file should not exist'))
					}
					else {
						done(new Error('contents read did not match contents written'))
					}
				}
				catch (err) {
					// This is correct since the file shouldn't exist
					done()
				}
			}

			f()
		})

		it("a stream read", function (done) {
			let s = getSink()
			try {
				let data = ''
				let stream = s.readStream('data1.txt')
				stream.on('data', (chunk) => {
					data += chunk
				})
				stream.on('close', () => {
					if (msg == data.toString()) {
						done()
					}
					else {
						done(new Error('contents read did not match contents written'))
					}
				})
			}
			catch (error) {
				return done(error)
			}
		})

		it("a stream read of a non-existent file", function (done) {
			let s = getSink()
			let triggeredError = false
			try {
				let data = ''
				let stream = s.readStream('data1-this-does-not-exist.txt')
				stream.on('data', (chunk) => {
					if (!triggeredError) {
						done(new Error('should not have gotten data'))
						triggeredError = true
					}
				})
				stream.on('close', () => {
					if (!triggeredError) {
						done(new Error('should not have gotten data'))
						triggeredError = true
					}
				})
				stream.on('error', (err) => {
					// we got an error, which is good, since this file does not exist
					done()
				})
			}
			catch (error) {
				return done(error)
			}
		})

		it("delete non-existent file", function (done) {
			let s = getSink()
			try {

				let promise = s.rm('testfile4')
				promise.then((data) => {
					done(new Error('we should have gotten an error'))
				})
					.catch(err => {
						done()
					})
			}
			catch (error) {
				return done(error)
			}
		})


		it("a directory create", function (done) {
			let s = getSink()
			try {

				let promise = s.mkdir('testdir')
				promise.then(async (data) => {
					let info = await s.getFullFileInfo('testdir')
					assert.equal('testdir', info.name)
					done()
				})
			}
			catch (error) {
				return done(error)
			}
		})

		it("a directory delete", function (done) {
			let s = getSink()
			try {
				let promise = s.rm('testdir')
				promise.then((data) => {
					done()
				})
				.catch(err => {
					done(err)
				})
			}
			catch (error) {
				return done(error)
			}
		})

		it("a directory read", function (done) {
			let s = getSink()
			try {
				let promise = s.getFullFileInfo('')
				promise.then((data) => {
					if (data.children.length == 4) {
						done()
					}
					else {
						done(new Error('the directory did not contain the right number of files'))
					}
				})
			}
			catch (error) {
				return done(error)
			}
		})


	})
}

module.exports = addBasicCases