// This is Reykunyu's service worker, which makes sure that Reykunyu stays
// usable when the user doesn't have a network connection or the server is
// unreachable for some other reason.
//
// It works by intercepting each request that Reykunyu's frontend makes. Static
// resources are simply served from a cache. For search functionality, this
// service worker basically runs Reykunyu's server code on the client side.

import Reykunyu from 'src/reykunyu';

console.log('Starting Reykunyu\'s service worker');

let reykunyu: Reykunyu;

// TypeScript hack: TS doesn't know we are in a service worker, so it doesn't
// declare self as a ServiceWorkerGlobalScope. We override that here; see
// https://github.com/microsoft/TypeScript/issues/14877#issuecomment-493729050.
export default null;
declare var self: ServiceWorkerGlobalScope;

const staticResourceNames = [
	"/offline",
	"/words.json",
	"/css/index.css",
	"/fonts/GentiumPlus-Regular.woff2",
	"/fonts/Recursive_VF_1.078.woff2",
	"/images/favicon.png",
	"/images/ke'u.svg",
	"/images/reykunyu-dark.svg",
	"/images/reykunyu.png",
	"/images/reykunyu.svg",
	"/images/srungtsyìp.svg",
	"/images/tsahey.svg",
	"/js/index.js",
	"/js/ui-translations.js",
	"/manifest.webmanifest",
	"/opensearch.xml",
	"/vendor/jquery/jquery-3.3.1.js",
	"/vendor/semantic/dist/semantic.css",
	"/vendor/semantic/dist/semantic.js",
	"/vendor/semantic/dist/themes/default/assets/fonts/icons.woff2",
];

const cacheResources = async () => {
	const cache = await caches.open('v1');
	await cache.addAll(staticResourceNames);
}

// installation: add necessary resources to the cache
self.addEventListener('install', (event) => {
	self.skipWaiting();
	event.waitUntil(cacheResources());
});

// activation: always claim all clients
self.addEventListener('activate', (event) => {
	self.clients.claim();
});

// fetch: intercept requests if the server is unreachable
const cacheFallback = async (request: Request): Promise<Response> => {
	const url = new URL(request.url);
	const path = url.pathname;
	const responseFromCache = await caches.match(path === '/' ? '/offline' : request);
	if (responseFromCache) {
		return responseFromCache;
	}
	return new Response('No network connection', {
		'status': 408,
		'headers': { 'Content-Type': 'text/plain' }
	});
};

fetch('/words.json').then(async (res) => {
	let dictionaryJSON = await res.json();
	reykunyu = new Reykunyu(dictionaryJSON);
}).catch((reason: any) => {
	console.error('Couldn\'t fetch dictionary data', reason);
});

const getOfflineResponse = async (request: Request): Promise<Response> => {
	const url = new URL(request.url);
	const path = url.pathname;
	if (path === '/api/fwew-search') {
		// if it's a search, then search locally and return that
		const query = url.searchParams.get("query")!; // TODO proper error handling...
		const language = url.searchParams.get("language")!;
		const dialect = url.searchParams.get("dialect")! as Dialect;
		let fromNaviResult = reykunyu.getResponsesFor(query, dialect);
		let toNaviResult = reykunyu.getReverseResponsesFor(query, language, dialect);
		let result = {
			'fromNa\'vi': fromNaviResult,
			'toNa\'vi': toNaviResult,
			'offline': true
		};
		const response = new Response(JSON.stringify(result), {
			headers: { 'Content-Type': 'application/json' }
		});
		return response;

	} else {
		// else it's a static resource, so fetch it from the cache
		return cacheFallback(request);
	}
}

self.addEventListener("fetch", (event) => {
	event.respondWith(
		fetch(event.request).then((response) => {
			if (!response.ok) {
				return getOfflineResponse(event.request);
			}
			return response;
		}).catch((error) => {
			return getOfflineResponse(event.request);
		})
	);
});
