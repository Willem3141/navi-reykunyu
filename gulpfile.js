const { src, dest } = require('gulp');
const less = require('gulp-less');
const path = require('path');

function compileLess(cb) {
	return src('./less/tìlam.less')
		.pipe(less({
			paths: [path.join(__dirname, 'less')]
		}))
		.pipe(dest('./fraporu/tìlam'));
};

exports.less = compileLess;
exports.default = compileLess;
