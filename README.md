# web-dicts
A Node.js app that processes http requests from famous search providers.

The app wraps the official/unofficial APIs of a few search providers, and creates a json object that can be used by you. 

The processed data can be displayed using [this android app](https://github.com/eviabs/Dicts).


## The API
A running instance is available [here](https://web-dicts.herokuapp.com/). As for this moment, the following requests are supported:

* Morfix: https://web-dicts.herokuapp.com/dic/morfix?t=walrus
* Urban Dictionary: https://web-dicts.herokuapp.com/dic/urban?t=walrus
* Wikipedia: https://web-dicts.herokuapp.com/dic/wikipedia?t=walrus
* QWANT Images: https://web-dicts.herokuapp.com/dic/images?t=walrus&count=5

*A full documentation is available in the code itself.*


## Authors

**Evyatar Ben-Shitrit** - [eviabs](https://github.com/eviabs)

## License

This project is licensed under the MIT License.
