**Reykunyu** lu lì'upuk a tsafa fko tsun fwivew aylì'ut leNa'vi, ulte rivun tìralpengit le'Ìnglìsì ulte lahea aysäomumit a tsalì'uteri. Aylì'upukto alahe, fmi Reykunyu tivìng aysäomumit leno nì'ul.

Fko tsun mivay' Reykunyut fìtsenge: https://reykunyu.lu.

---

**Reykunyu** (‘someone who lets you discover things’) is a dictionary in which you can search for Na'vi words and see the English translation and other information about that word. Reykunyu tries to give more detailed information than other dictionaries.

You can try out Reykunyu at https://reykunyu.lu.


## Installation

After cloning this repository, set configuration (port, secret key) in `config.json` and then run:
```sh
npm install  # to install dependencies
npm run build  # to compile frontend assets (LESS, TypeScript)
npm run start  # to run the server
```

To be able to actually use this, you'll need not only the dictionary here, but also the list of words (`data/words.json`). If you'd like to mirror the instance at https://reykunyu.lu, you can run
```sh
mkdir data
wget -O data/words.json https://reykunyu.lu/words.json
```
and then restart the server.


## API

Reykunyu offers an API for looking up words. See https://reykunyu.lu/help (click "API documentation") for details.


## Contributions

If you want to contribute to Reykunyu, please see [the contribution guidelines](CONTRIBUTING.md).


## Architecture

Reykunyu has a backend (in `src`) and a frontend (in `frontend/src`); both are written in TypeScript. The backend handles search queries and for that purpose implements a large range of functions related to Na'vi grammar. For example, to be able to search for affixed words, the backend needs to know how to apply affixes to nouns, adjectives, and verbs, and (more complicated) it also needs to be able to do this affixing process in reverse.

The architecture is somewhat complicated by the fact that the frontend supports an “offline mode”: a service worker that replaces Reykunyu's server and allows doing searches without needing an internet connection. The service worker actually reuses the backend code, so that the entire affixing machinery works in offline mode as well. Consequentially, we have to be able to compile much of the backend code both for Node.js and for the service worker. Fortunately with modern ECMAScript modules this is quite doable, but we have to keep in mind that any files that need to work in a service worker context cannot import Node.js modules such as `fs`.

The gulpfile has separate build steps for the Node.js backend (`buildTypeScriptServer`) and the service worker (`buildTypeScriptServiceWorker`) so when getting errors from one of those, it should be easy to see where the problem lies.
