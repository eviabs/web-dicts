# web-dicts
A Node.js app that processes http requests from famous search providers.

The app wraps the official/unofficial APIs of a few search providers, and creates a json object that can be used by you. 

The processed data can be displayed using [this android app](https://github.com/eviabs/Dicts).

## Run
```bash
node bin/www [port]
```
Port is optional (if none given, default is 80).

## The API
### A running instance is available [here](https://web-dicts.herokuapp.com/). 

As for this moment, the following requests are supported:

* Morfix: https://web-dicts.herokuapp.com/dic/morfix?t=walrus
* Milog: https://web-dicts.herokuapp.com/dic/milog?t=שלום
* Urban Dictionary: https://web-dicts.herokuapp.com/dic/urban?t=walrus
* Wikipedia: https://web-dicts.herokuapp.com/dic/wikipedia?t=walrus
* QWANT Images: https://web-dicts.herokuapp.com/dic/images?t=walrus&count=5

*A full documentation is available in the code itself.*

### Add Seach Provider
If you wish to add a search provider, there are several steps that must be done:
1. Place your new search provider under `dic` route: `/dic/your_search_provider`.
2. There is only one mandatory parameter: `t`. It holds the term that the user wants to search for (`/dic/your_search_provider?t=user_search_term`). Any additional  parameters are allowed.
3. The response of the request should look like that:
   ```javascript
   {
   	error: error_num,
   	[...]
   }
   ```
   `error_num` is a number that holds the state of the request. You can use this as you wish, but also must support the following errors:
   ``` javascipt
   0 // query executed successfully
   1 // remote server error
   2 // no results found
   3 // no such search provider
   4 // bad query
   ```

   `[...]` is any other data you need to display.

## Authors

**Evyatar Ben-Shitrit** - [eviabs](https://github.com/eviabs)

## License

This project is licensed under the MIT License.
