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
