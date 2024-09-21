const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
	let config = {
		entry: {
			'index': './src/index.ts'
		},
		resolve: {
			extensions: ['.ts', '.js'],
			modules: [path.resolve(__dirname, '../node_modules'), 'node_modules']
		},
		output: {
			filename: 'js/index.js',
			path: path.resolve(__dirname, 'dist'),
			clean: true
		},
		plugins: [
			new HtmlWebpackPlugin({
				template: 'src/ejs/index.ejs',
				filename: 'ejs/index.ejs'
			}),
			new HtmlWebpackPlugin({
				template: 'src/ejs/header.ejs',
				filename: 'ejs/header.ejs',
				inject: false
			})
		],
		module: {
			rules: [
				{
					test: /\.less$/i,
					use: [
						MiniCssExtractPlugin.loader,
						'css-loader',
						'less-loader',
					],
				},
				{
					test: /\.ts$/,
					use: 'ts-loader',
					exclude: /node_modules/,
				},
				{
					test: /\.(woff|woff2|eot|ttf|otf)$/i,
					type: 'asset/resource',
				},
				{
					test: /\.(svg|png|jpg)$/i,
					type: 'asset/resource',
				},
				{
					test: /\.(html|ejs)$/i,
					use: 'html-loader',
				}
			],
		},
		performance: {
			maxAssetSize: 1000000,
		},
	};

	if (argv.mode === 'development') {
		config['devtool'] = 'inline-source-map';
		config['module']['rules'][0]['use'][0] = 'style-loader';
		config['mode'] = 'development';
	} else {
		config['plugins'].push(new MiniCssExtractPlugin());
		config['mode'] = 'production';
	}
	return config;
}
