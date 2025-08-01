const { src, dest, parallel, series } = require('gulp');
const less = require('gulp-less');
const ts = require('gulp-typescript');
const esbuild = require('esbuild');
const path = require('path');

function buildLess(cb) {
	return src(['./frontend/less/index.less', './frontend/less/study.less', './frontend/less/editor.less'])
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
			'./frontend/src/edit.ts',
			'./frontend/src/study.ts',
			'./frontend/src/review.ts',
			'./frontend/src/data-errors.ts'
		],
		bundle: true,
		minify: true,
		sourcemap: true,
		outdir: './frontend/dist/js/',
		target: 'es2016'
	}).catch(() => { process.exit(1); });
};

function doTypecheckServiceWorker(cb) {
	const tsProject = ts.createProject("./frontend/sw/tsconfig.json");
	return tsProject.src()
		.pipe(tsProject())
		.on('error', () => { process.exit(1); });
};

function buildTypeScriptServiceWorker(cb) {
	return esbuild.build({
		entryPoints: [
			'./frontend/sw/sw.ts'
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

function buildTypeScriptServer(cb) {
	return esbuild.build({
		entryPoints: [
			'./src/server.ts',
			'./src/profile.ts'
		],
		bundle: true,
		sourcemap: true,
		platform: 'node',
		outdir: './dist',
		target: 'node16.19',
		packages: 'external',
		format: 'cjs'
	}).catch(() => { process.exit(1); });
};


exports.buildLess = buildLess;
exports.buildClient = series(doTypecheckClient, buildTypeScriptClient);
exports.buildServiceWorker = series(doTypecheckServiceWorker, buildTypeScriptServiceWorker);
exports.buildServer = series(doTypecheckServer, buildTypeScriptServer);
exports.buildWithoutTypecheck = parallel(buildLess, buildTypeScriptClient, buildTypeScriptServiceWorker, buildTypeScriptServer);
exports.default = parallel(buildLess, exports.buildClient, exports.buildServiceWorker, exports.buildServer);
