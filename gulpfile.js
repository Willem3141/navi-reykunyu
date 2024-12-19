const { src, dest, parallel, series } = require('gulp');
const less = require('gulp-less');
const ts = require('gulp-typescript');
const esbuild = require('esbuild');
const path = require('path');

function buildLess(cb) {
	return src(['./frontend/less/index.less', './frontend/less/study.less'])
		.pipe(less({
			paths: [path.join(__dirname, 'less')]
		}))
		.pipe(dest('./frontend/dist/css/'));
};

function doTypecheckClient(cb) {
	const tsProject = ts.createProject("./frontend/src/tsconfig.json");
	return tsProject.src()
		.pipe(tsProject())
		.on('error', () => { process.exit(1); });
};

function buildTypeScriptClient(cb) {
	return esbuild.build({
		entryPoints: [
			'./frontend/src/index.ts',
			'./frontend/src/all-words.ts',
			'./frontend/src/study.ts',
			'./frontend/src/review.ts'
		],
		bundle: true,
		minify: true,
		sourcemap: true,
		outdir: './frontend/dist/js/',
		target: 'es2016'
	}).catch(() => { process.exit(1); });
};

function doTypecheckServer(cb) {
	const tsProject = ts.createProject("./src/tsconfig.json");
	return tsProject.src()
		.pipe(tsProject())
		.on('error', () => { process.exit(1); });
};

exports.buildLess = buildLess;
exports.doTypecheckServer = doTypecheckServer;
exports.buildTypeScriptClient = series(doTypecheckClient, buildTypeScriptClient);
exports.buildWithoutTypecheck = parallel(exports.buildLess, buildTypeScriptClient);
exports.default = parallel(exports.buildLess, exports.buildTypeScriptClient, exports.doTypecheckServer);
