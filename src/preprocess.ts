// normalizes a query by replacing weird Unicode tìftang variations by
// normal ASCII ', and c -> ts / g -> ng
export function preprocessQuery(query: string, dialect: Dialect): string {
	query = query.trim();
	query = query.replace(/’/g, "'");
	query = query.replace(/‘/g, "'");
	query = query.replaceAll("\u{AD}", "");

	query = query.replace(/sh/g, "sy");
	query = query.replace(/Sh/g, "Sy");
	query = query.replace(/ch/g, "tsy");
	query = query.replace(/Ch/g, "Tsy");

	if (dialect !== 'RN') {
		query = query.replace(/b/g, "px");
		query = query.replace(/B/g, "Px");
		query = query.replace(/d/g, "tx");
		query = query.replace(/D/g, "Tx");
		query = query.replace(/-g/g, "kx");
		query = query.replace(/-G/g, "Kx");
		query = query.replace(/·g/g, "kx");
		query = query.replace(/·G/g, "Kx");
		query = query.replace(/(?<![Nn])g/g, "kx");
		query = query.replace(/(?<![Nn])G/g, "Kx");
		query = query.replace(/·/g, "");
		query = query.replace(/ù/g, "u");
		query = query.replace(/Ù/g, "U");
	}

	return query;
}
