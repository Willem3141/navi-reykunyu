// This is Reykunyu's service worker, which makes sure that Reykunyu stays
// usable when the user doesn't have a network connection or the server is
// unreachable for some other reason.
//
// It works by intercepting each request that Reykunyu's frontend makes. Static
// resources are simply served from a cache. For search functionality, this
// service worker basically runs Reykunyu's server code on the client side.

import Reykunyu from 'src/reykunyu';
import * as conjugationString from 'src/conjugationString';
import * as verbs from 'src/verbs/conjugator';

console.log('Starting Reykunyu\'s service worker');

// TypeScript hack: TS doesn't know we are in a service worker, so it doesn't
// declare self as a ServiceWorkerGlobalScope. We override that here; see
// https://github.com/microsoft/TypeScript/issues/14877#issuecomment-493729050.
export default null;
declare var self: ServiceWorkerGlobalScope;

const staticResourceNames = [
	"/offline",
	"/offline/all",
	"/offline/help",
	"/offline/unavailable",
	"/words.json",
	"/css/index.css",
	"/fonts/GentiumPlus-Regular.woff2",
	"/fonts/Recursive_VF_1.078.woff2",
	"/images/favicon.png",
	"/images/infixes-arrow.svg",
	"/images/ke'u.svg",
	"/images/pronunciation-arrow.svg",
	"/images/reykunyu-dark.svg",
	"/images/reykunyu.png",
	"/images/reykunyu.svg",
	"/images/srungtsyìp.svg",
	"/images/translation-arrow.svg",
	"/images/tsahey.svg",
	"/images/type-arrow.svg",
	"/js/all-words.js",
	"/js/help.js",
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

const offlinePaths: Record<string, string> = {
	'/': '/offline',
	'/all': '/offline/all',
	'/help': '/offline/help'
};

// fetch: intercept requests if the server is unreachable
const cacheFallback = async (request: Request): Promise<Response> => {
	const url = new URL(request.url);
	const path = url.pathname;
	const responseFromCache = await caches.match(offlinePaths.hasOwnProperty(path) ? offlinePaths[path] : request);
	if (responseFromCache) {
		return responseFromCache;
	}
	// fallback: offline unavailable page
	const unavailableResponseFromCache = await caches.match('/offline/unavailable');
	if (unavailableResponseFromCache) {
		return new Response(unavailableResponseFromCache.body, {
			'status': 408,
			'headers': { 'Content-Type': 'text/html' }
		});
	}
	// if something went wrong: fallback to hardcoded error
	return new Response('No network connection', {
		'status': 408,
		'headers': { 'Content-Type': 'text/plain' }
	});
};

let reykunyu: Reykunyu | null = null;

const initializeReykunyu = async () => {
	const words = await caches.match('/words.json');
	if (!words) {
		throw Error('Dictionary data not found in cache');
	}
	let dictionaryJSON = await words.json();
	reykunyu = new Reykunyu(dictionaryJSON);
};
const initializePromise = initializeReykunyu();

const getOfflineResponse = async (request: Request): Promise<Response> => {
	const url = new URL(request.url);
	const path = url.pathname;
	if (path.startsWith('/api')) {
		// handle API calls locally
		await initializePromise;
		if (!reykunyu) {
			return new Response('Service worker couldn\'t access dictionary data', {
				'status': 500,
				'headers': { 'Content-Type': 'text/plain' }
			});
		}
		let result: any = {};
		if (path === '/api/fwew-search') {
			const query = url.searchParams.get('query')!;
			const language = url.searchParams.get('language')!;
			const dialect = url.searchParams.get('dialect')! as Dialect;
			const fromNaviResult = reykunyu.getResponsesFor(query, dialect);
			const toNaviResult = reykunyu.getReverseResponsesFor(query, language, dialect);
			result = {
				'fromNa\'vi': fromNaviResult,
				'toNa\'vi': toNaviResult
			};

		} else if (path === '/api/mok') {
			const query = url.searchParams.get('tìpawm')!;
			const language = url.searchParams.get('language')!;
			const dialect = url.searchParams.get('dialect')! as Dialect;
			result = reykunyu.getSuggestionsFor(query, language, dialect);

		} else if (path === '/api/rhymes') {
			const query = url.searchParams.get('tìpawm')!;
			const dialect = url.searchParams.get('dialect')! as Dialect;
			result = reykunyu.getRhymes(query, dialect);

		} else if (path === '/api/list/all') {
			result = reykunyu.getAll();

		} else if (path === '/api/conjugate/verb') {
			result = reykunyu.getAll();
			const verb = url.searchParams.get('verb')!;
			const prefirst = url.searchParams.get('prefirst')!;
			const first = url.searchParams.get('first')!;
			const second = url.searchParams.get('second')!;
			result = conjugationString.formsFromString(verbs.conjugate(verb, [prefirst, first, second]));

		} else if (path === '/api/annotated/search' || path === '/api/annotated/suggest') {
			result = {'results': []};  // stub; AD search is not supported in offline mode

		} else {
			return new Response('Unknown API request', {
				'status': 404,
				'headers': { 'Content-Type': 'text/plain' }
			});
		}
		result['offline'] = true;
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
	// Leave POST requests alone.
	if (event.request.method !== "GET") {
		return;
	}

	event.respondWith(
		// We fallback to generating an offline response when a network error
		// occurred, but not when we get an HTTP error.
		fetch(event.request).then((response) => {
			return response;
		}).catch((error) => {
			return getOfflineResponse(event.request);
		})
	);
});
