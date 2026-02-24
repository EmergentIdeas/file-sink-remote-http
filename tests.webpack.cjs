const path = require('path');
// const NodePolyfillPlugin = require('node-polyfill-webpack-plugin')
const webpack = require('webpack')

/* need to install:

npm i --save-dev webpack-cli node-polyfill-webpack-plugin

*/


let buildTargets = []


let testsTarget =
{
	entry: './client-js/tests.mjs',
	mode: 'production',
	"devtool": 'source-map',
	experiments: {
		outputModule: true,
	},
	output: {
		filename: 'tests.js',
		path: path.resolve(__dirname, 'public/js'),
		library: {
			type: 'module',
		}
	},
	module: {
	},
	plugins: [
		new webpack.ProvidePlugin({
			Buffer: ['buffer', 'Buffer'],
		})
	],
	stats: {
		colors: true,
		reasons: true
	}
	, externals: {
		"file-sink-remote-http": 'file-sink-remote-http'
	}

}

buildTargets.push(testsTarget)

module.exports = buildTargets
