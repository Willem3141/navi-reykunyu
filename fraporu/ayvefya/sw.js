// This is Reykunyu's service worker, which makes sure that Reykunyu stays
// usable when the user doesn't have a network connection or the server is
// unreachable for some other reason.
//
// It works by intercepting each request that Reykunyu's frontend makes. Static
// resources are simply served from a cache. For search functionality, this
// service worker basically runs Reykunyu's server code on the client side.

console.log('service worker starting');

// installation: populate cache with static resources
const addResourcesToCache = async (resources) => {
	const cache = await caches.open("v1");
	await cache.addAll(resources);
};

self.addEventListener("install", (event) => {
	self.skipWaiting();
	event.waitUntil(
		addResourcesToCache([
			"/",
			"/aysrungsiyu/semantic/dist/semantic.css",
			"/tìlam/tìlam.css",
			"/aysrungsiyu/jquery/jquery-3.3.1.js",
			"/aysrungsiyu/semantic/dist/semantic.js",
			"/ayvefya/ui-translations.js",
			"/ayvefya/reykunyu.js",
			"/ayrel/reykunyu.svg",
			"/ayrel/reykunyu.png",
			"/ayrel/reykunyu-dark.svg",
			"/ayrel/ke'u.svg",
			"/aysrungsiyu/semantic/dist/themes/default/assets/fonts/icons.woff2",
			"/fonts/Recursive_VF_1.078.woff2",
			"/ayrel/favicon.png",
			"/manifest.webmanifest",
		])
	);
});

// activation: always claim all clients
self.addEventListener("activate", (event) => {
	self.clients.claim();
});

// fetch: intercept requests if the server is unreachable
const cacheFirst = async (request) => {
	const responseFromCache = await caches.match(request);
	if (responseFromCache) {
		return responseFromCache;
	}
	return fetch(request);
};
const getFallback = async (request) => {
	const url = new URL(request.url);
	const path = url.pathname;
	if (path === '/api/fwew-search') {
		// if it's a search, then search locally and return that
		const results = {
			'fromNa\'vi': [
				{
					'tìpawm': 'batsch',
					'sì\'eyng': [],
					'aysämok': []
				}
			],
			'toNa\'vi': []
		};
		const response = new Response(JSON.stringify(results), {
			headers: { 'Content-Type': 'application/json' }
		});
		return response;

	} else {
		// else it's a static resource, so fetch it from the cache
		return cacheFirst(request);
	}
}

self.addEventListener("fetch", (event) => {
	event.respondWith(
		fetch(event.request).then(function (response) {
			if (!response.ok) {
				return getFallback(event.request);
			}
			return response;
		}).catch(function (error) {
			return getFallback(event.request);
		})
	);
});

