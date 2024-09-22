const { src, dest, parallel, series } = require('gulp');
const less = require('gulp-less');
const ts = require('gulp-typescript');
const esbuild = require('esbuild');
const path = require('path');

function buildLess(cb) {
	return src('./frontend/less/tìlam.less')
		.pipe(less({
			paths: [path.join(__dirname, 'less')]
		}))
		.pipe(dest('./frontend/dist/css/'));
};

function doTypecheck(cb) {
	const tsProject = ts.createProject("./frontend/src/tsconfig.json");
	return tsProject.src()
		.pipe(tsProject())
		.on('error', () => { process.exit(1); });
};

function buildTypeScript(cb) {
	return esbuild.build({
		entryPoints: ['./frontend/src/index.ts'],
		bundle: true,
		minify: true,
		sourcemap: true,
		outfile: './frontend/dist/js/index.js',
		target: 'es2016'
	}).catch(() => { process.exit(1); });
};

exports.buildLess = buildLess;
exports.buildTypeScript = series(doTypecheck, buildTypeScript);
exports.default = parallel(exports.buildLess, exports.buildTypeScript);
