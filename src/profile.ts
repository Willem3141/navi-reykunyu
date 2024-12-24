// Simple script to profile Reykunyu's search

import * as reykunyu from './reykunyu';

const queries = [
	'kxì',
	'mengaru',
	'tswon',
	'tswayon',
	'tswayayon',
	'tswayayayon',
	'pefneioangtsyìpit',
	'ngaru lu fpom srak?',
	'po täpeykìyeverkeiup nìnäk',
	'Ma oeyä eylan, faysänumviri rutxe fì’ut tslivam: Nìltsan omum oel futa ayhapxìtul lì’fyaolo’ä awngeyä txantsana aysänumvit ngolop fte aylaru kivar. Faysulfätuä tìkangkem oheru meuia luyu nìngay. Kllkxayem fìtìkangkem oeyä rofa — ke io — pum feyä.'
];
const sampleCount = 40;
const spinUpCount = 40;

for (let query of queries) {
	const measurements: number[] = [];
	for (let i = 0; i < sampleCount + spinUpCount; i++) {
		const startTime = process.hrtime();
		reykunyu.getResponsesFor(query, 'combined');
		const time = process.hrtime(startTime)[1] / 1000000;
		if (i >= spinUpCount) {
			measurements.push(time);
		}
	}
	const average = measurements.reduce((a, b) => a + b, 0) / measurements.length;
	const variance = measurements.map(u => (u - average) ** 2).reduce((a, b) => a + b, 0) / measurements.length;
	const stdDev = variance ** 0.5;
	console.log(average.toFixed(2).padStart(6) + '  ± ' + stdDev.toFixed(2).padStart(5) + ' ms  -  ' + query);
}
