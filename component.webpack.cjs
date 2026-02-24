const path = require('path');
const webpack = require('webpack')

let buildTargets = []

let browserTarget =
{
	entry: './lib/component.mjs',
	mode: 'production',
	"devtool": 'source-map',
	experiments: {
		outputModule: true,
	},
	output: {
		filename: 'file-sink-remote-http.js',
		path: path.resolve(__dirname, 'resources'),
		library: {
			type: 'module',
		}
	},
	module: {
	},
	resolve: {
		fallback: {
			// stream: require.resolve('stream-browserify'),
		}
	},
	plugins: [
		new webpack.ProvidePlugin({
			Buffer: ['buffer', 'Buffer'],
		})
	],
	stats: {
		colors: true,
		reasons: true
	},

}

buildTargets.push(browserTarget)

module.exports = buildTargets
