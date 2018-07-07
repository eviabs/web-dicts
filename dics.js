/**
 * Manages the requests.
 */

// Consts
const QUERY_PARAM_TERM = "t"; // query "term" param
const QUERY_PARAM_COUNT = "count"; // query "count" param
const ERROR_CODE_NO_ERROR = 0; // query executed successfully
const ERROR_CODE_SERVER_ERROR = 1; //remote server error
const ERROR_CODE_NO_RESULTS = 2; // no results
const ERROR_CODE_NO_SUCH_DIC = 3; // no such dictionary
const ERROR_CODE_BAD_QUERY = 4; // bad query

const EMPTY = "";

const POST_REQUEST = "POST";
const GET_REQUEST = "GET";

// Includes
let request = require("request");
let cheerio = require('cheerio'); // https://github.com/cheeriojs/cheerio

module.exports = {
    /** query "term" param */
    QUERY_PARAM_TERM: QUERY_PARAM_TERM,

    /** query "count" param */
    QUERY_PARAM_COUNT: QUERY_PARAM_COUNT,

    /** query executed successfully */
    ERROR_CODE_NO_ERROR: ERROR_CODE_NO_ERROR, //

    /**  remote server error */
    ERROR_CODE_SERVER_ERROR: ERROR_CODE_SERVER_ERROR,

    /** no results */
    ERROR_CODE_NO_RESULTS: ERROR_CODE_NO_RESULTS,

    /** no such dictionary */
    ERROR_CODE_NO_SUCH_DIC: ERROR_CODE_NO_SUCH_DIC,

    /** bad query */
    ERROR_CODE_BAD_QUERY: ERROR_CODE_BAD_QUERY,

    /**
     * Creates the error json object based on errno
     *
     * @param errno error code
     * @returns {{ERROR_KEYWORD: *}}
     */
    get_error_json: get_error_json,

    /**
     * Urban Dictionary
     * API http://api.urbandictionary.com/v0/define?term={word}
     * Documentation: https://github.com/zdict/zdict/wiki/Urban-dictionary-API-documentation
     *
     *
     * @param query
     * @param res response object
     */
    urban_dictionary: function (query, res) {
        let urban_dictionary_url = "http://api.urbandictionary.com/v0/define?term=" + encodeURIComponent(query[QUERY_PARAM_TERM]);

        get_request(res, urban_dictionary_url, function (res, body) {
            res.header("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(urban_dictionary_process_result(body), null, 4));
        });
    },

    /**
     * Morfix
     * Uses the unofficial api (same api that is used by Morfix official android app)
     *
     * @param query
     * @param res response object
     */
    morfix: function (query, res) {
        let morfix_url = "http://services.morfix.com/TranslationHebrew/TranslationService.svc/GetTranslation/";
        let morfix_headers = {"Accept": "application/json", "Host": "services.morfix.com", "Content-Type": "application/json"};
        let morfix_body = {"Query": encodeURIComponent(query[QUERY_PARAM_TERM]),"ClientName":"Android_Hebrew"};

        post_request(res, morfix_url, morfix_headers, morfix_body, function (res, body) {
            res.header("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(morfix_process_result(body), null, 4));
        });

    },

    /**
     * Milog
     * Scarapes https://milog.co.il/{query}
     *
     * @param query
     * @param res response object
     */
    milog: function (query, res) {
        let milog_url = "https://milog.co.il/" + encodeURIComponent(query[QUERY_PARAM_TERM]);

        get_request(res, milog_url, function (res, body) {
            res.header("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(milog_process_result(body), null, 4));
        });

    },
    /**
     * Qwant images
     * API https://api.qwant.com/api/search/images?count=10&offset=1&q={term}
     * API https://api.qwant.com/api/search/images?count=10&offset=1&q=hello
     * Uses the unofficial api.
     *
     * @param query
     * @param res
     */
    images: function (query, res) {
        let count = query[QUERY_PARAM_COUNT];
        count = isNaN(count) ? 10 : count;
        count = count < 1 ? 10 : count;

        let qwant_images_url = "https://api.qwant.com/api/search/images?count=" + count +"&offset=1&q=" + encodeURIComponent(query[QUERY_PARAM_TERM]);

        get_request(res, qwant_images_url, function (res, body) {
            res.header("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(qwant_images_process_result(body), null, 4));
        });
    },

    /**
     * Wikipedia
     * Official API Hebrew https://he.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&redirects=1&titles={term}
     * Official API English https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&redirects=1&titles={term}
     *
     * @param query
     * @param res
     */
    wikipedia: function (query, res) {
        let wikipedia_url = "https://" + lang(query[QUERY_PARAM_TERM]) + ".wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&redirects=1&titles=" + encodeURIComponent(query[QUERY_PARAM_TERM]);

        get_request(res, wikipedia_url, function (res, body) {
            res.header("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(wikipedia_process_result(body), null, 4));
        });
    },

    /**
     * Checks that the query contains all only allowed params
     *
     * @param query
     * @param allowed_params
     * @returns {boolean}
     */
    validate_query: function (query, allowed_params) {
        let res = true;
        Object.keys(query).forEach(function (param) {
            if (!allowed_params.includes(param)){
                res = false;
            }
        });
        return res;
    }
};

// ===================================================================================================
// ================================  General Utils Helpers  ==========================================
// ===================================================================================================

/**
 * Checks if a string contains hebrew chars
 *
 * @param str
 * @returns {boolean}
 */
let contains_hebrew_chars = function (str) {
    // http://www.utf8-chartable.de/unicode-utf8-table.pl?start=1280
    return  /[\u05D0-\u05EA]/.test(str);
};

/**
 * Checks the language of a string.
 * At the moment, only english and hebrew are supported.
 * If the string contains hebew chars, "he" is returned. "en" is returned otherwise.
 *
 * @param str
 * @returns {string} the language
 */
let lang = function (str) {
    // http://www.utf8-chartable.de/unicode-utf8-table.pl?start=1280
    return contains_hebrew_chars(str) ? "he" : "en";
};

// ===================================================================================================
// ================================  HTTP Requests Helpers  ==========================================
// ===================================================================================================

/***
 * Manages HTTP requests sent from the server
 * Should handle POST_REQUEST or GET_REQUEST
 *
 * @param res The request
 * @param method The method: post/get
 * @param url The request url (should include the query params if available)
 * @param headers The Headers in json format. Set as undefined if no headers needed.
 * @param body The Body of the request. Set as undefined if no body needed.
 * @param success_callback The success callback. Default success callback will be called if set to undefined.
 * @param error_callback The error callback. Default error callback will be called if set to undefined.
 */
function server_request(res, method, url, headers, body, success_callback, error_callback) {
    request({
            headers: headers,
            method: method,
            url: url,
            json: true,
            body: body
        },
        function (error, response, body) {
            // if success, call the default success function or the given success_callback
            if (!error && response.statusCode === 200) {
                success_callback !== undefined ? success_callback(res, body) : default_success(res, body);

                // if error, call the default error function or the given error_callback
            } else {
                // print error to console - for debugging
                console.log(error);
                error_callback !== undefined ? error_callback(res, body) : default_error(res, body);
            }
        });
}

/***
 * Default success callback
 *
 * @param res
 * @param body
 */
function default_success(res, body) {
    res.end(JSON.stringify(body, null, 4));
}

/***
 * Default error callback
 *
 * @param res
 */
function default_error(res) {
    res.end(JSON.stringify(get_error_json(ERROR_CODE_SERVER_ERROR), null, 4));
}

/***
 * Creates a post request from this server
 *
 * @param res The request
 * @param url The request url (should include the query params if available)
 * @param headers The Headers in json format. Set as undefined if no headers needed.
 * @param body The Body of the request. Set as undefined if no body needed.
 * @param success_callback The success callback. Default success callback will be called if set to undefined.
 * @param error_callback The error callback. Default error callback will be called if set to undefined.
 */
function post_request(res, url, headers, body, success_callback, error_callback) {
    server_request(res, POST_REQUEST, url, headers, body, success_callback, error_callback);
}

/***
 * Creates a get request from this server
 *
 * Create a post request from this server
 * @param res The request
 * @param url The request url (should include the query params if available)
 * @param success_callback The success callback. Default success callback will be called if set to undefined.
 * @param error_callback The error callback. Default error callback will be called if set to undefined.
 */
function get_request(res, url, success_callback, error_callback) {
    let headers = {"User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0"};
    server_request(res, GET_REQUEST, url, headers, undefined, success_callback, error_callback);
}

/**
 * Creates the error json object based on errno
 *
 * @param errno error code
 * @returns {{ERROR_KEYWORD: *}}
 */
function get_error_json (errno) {
    return {error: errno};
}

// ===================================================================================================
// =============================  Specific Dictionaries Facades  =====================================
// ===================================================================================================

/***
 * A facade for Morfix's api.
 * Process the received search results:
 * 1) remove excess data
 * 2) rearrange the results to match the server's api
 *
 * @param search_result search results in json format
 * @returns {*}
 */
function morfix_process_result(search_result) {
    const ResultType = "ResultType";
    const CorrectionList = "CorrectionList";
    const TranslationType = "TranslationType";
    const Words = "Words";
    const Query = "Query";

    // the new (and empty) results object
    let new_result = {
        error: ERROR_CODE_NO_ERROR,
        ResultType: search_result[ResultType],
        Query: search_result[Query],
        TranslationType: search_result[TranslationType],
        CorrectionList: [],
        Words: []
    };

    switch (search_result[ResultType]) {
        // if no results are available, but there are suggestions, push them one by one to the array.
        case "Suggestions":
            search_result[CorrectionList].forEach(function (suggestion) {
                new_result[CorrectionList].push(suggestion["Word"]);
            });

            new_result.error = ERROR_CODE_NO_RESULTS;
            break;

        case "Match":
            // iterate over the Words and copy only the needed attributes and omit the rest
            search_result[Words].forEach(function (word) {

                // Words attributes:
                let new_word = {};
                ["InputLanguageMeanings",
                    "OutputLanguageMeanings",
                    "PartOfSpeech",
                    "OutputLanguageMeaningsString",
                    "Inflections",
                    "SampleSentences",
                    "SynonymsList"].forEach(function (attribute) {
                    new_word[attribute] = word[attribute];
                });
                new_result[Words].push(new_word);

                // Other attributes
                ["QueryRelatedCollocations",
                    "QueryRelatedPhrasalVerbs",
                    "QueryRelatedCollocationsObject"].forEach(function (attribute) {
                    new_result[attribute] = search_result[attribute];
                })

            });
            break;

        default:
            new_result.error = ERROR_CODE_NO_RESULTS
    }

    return new_result
}

/***
 * Scrapes Milog site
 *
 * @param search_result search results in html format
 * @returns {*}
 */
function milog_process_result(search_result) {
    // the new (and empty) results object
    let new_result = {
        error: ERROR_CODE_NO_ERROR,
        words: []
    };

    let meanings_results = [];

    // set the $ object
    let $ = cheerio.load(search_result, { decodeEntities: false });

    // iterate over the words
    $("[class=sr_e]").each(function (i, elem) {
        let current = {
            title: "none",
            definitions: []
        };

        // title
        current["title"] = $(this).find('a').html();

        // discard "did you mean" word
        if (current["title"].includes("- האם התכוונת ל:")) {
            return;
        }
        // definitions
        $(this).find('.sr_e_txt').each(function (i, elem) {

            try {
                // remove links for wikipedia
                if ($(this).find('span').find('a').attr('onmousedown').includes("_gaq.push")) {
                    current["definitions"].push($(this).text())
                }
            } catch (e) {
                // remove any other links
                if ($(this).find('a').length > 0) {
                    current["definitions"].push($(this).text())
                } else {
                    current["definitions"].push($(this).html())
                }
            }

        });

        // add current word (only if it has definitions)
        if (current.definitions.length > 0) {
            meanings_results.push(current);
        }
    });

    // if no results, set the current error
    if (meanings_results.length === 0) {
        new_result.error = ERROR_CODE_NO_RESULTS;
    }

    new_result.words = meanings_results;

    return new_result
}

/***
 * A facade for Urban Dictionary api.
 * Process the received search results:
 * 1) remove excess data
 * 2) rearrange the results to match the server's api
 *
 * @param search_result search results in json format
 * @returns {*}
 */
function urban_dictionary_process_result(search_result) {
    const result_type = "result_type";
    const list = "list";
    const sounds = "sounds";

    // the new (and empty) results object
    let new_result = {
        error: ERROR_CODE_NO_ERROR,
        result_type: search_result[result_type],
        list: [],
        sounds: []
    };

    switch (search_result[result_type]) {
        // if no results are available, but there are suggestions, push them one by one to the array.
        case "exact":
            // iterate over the Words and copy only the needed attributes and omit the rest
            search_result[list].forEach(function (word) {

                // Words attributes:
                let new_word = {};
                ["definition",
                    "word",
                    "thumbs_up",
                    "thumbs_down",
                    "author",
                    "example"].forEach(function (attribute) {
                    new_word[attribute] = word[attribute];
                });
                new_result[list].push(new_word);

                // Other attributes
                new_result[sounds] = search_result[sounds];

            });
            break;

        default:
            new_result.error = ERROR_CODE_NO_RESULTS
    }

    return new_result
}

/***
 * A facade for Qwant images api.
 * Process the received search results:
 * 1) remove excess data
 * 2) rearrange the results to match the server's api
 *
 * @param search_result search results in json format
 * @returns {*}
 */
function qwant_images_process_result(search_result) {
    const status = "status";


    // the new (and empty) results object
    let new_result = {
        error: ERROR_CODE_NO_ERROR,
        images: []
    };

    switch (search_result[status]) {
        // if no results are available, but there are suggestions, push them one by one to the array.
        case "success":
            // check if there was an API_ERROR
            if (search_result.data.error !== undefined) {
                new_result.error = ERROR_CODE_SERVER_ERROR;
                break;
            }

            // iterate over the Words and copy only the needed attributes and omit the rest
            search_result.data.result.items.forEach(function (img) {
                // Words attributes:
                let new_img = {};
                ["media",
                    "thumbnail"].forEach(function (attribute) {
                    new_img[attribute] = img[attribute];
                });
                new_img["thumbnail"] = "https:" + img["thumbnail"]; // https should be added manually
                new_result.images.push(new_img);

            });

            if (new_result.images.length === 0) {
                new_result.error = ERROR_CODE_NO_RESULTS;
            }
            break;




        default:
            new_result.error = ERROR_CODE_NO_RESULTS;
    }
    return new_result;
}

/***
 * A facade for Wikipedia api.
 * Process the received search results:
 * 1) remove excess data
 * 2) rearrange the results to match the server's api
 *
 * @param search_result search results in json format
 * @returns {*}
 */
function wikipedia_process_result(search_result) {

    // the new (and empty) results object
    let new_result = {
        error: ERROR_CODE_NO_ERROR,
        title: "",
        extract: ""
    };


    let first_result = (search_result.query === undefined) ? undefined : search_result.query.pages[Object.keys(search_result.query.pages)[0]];

    // if missing attribute is present, then no results found
    if (first_result !== undefined && first_result.missing === undefined) {
        new_result.title = first_result.title;
        new_result.extract = first_result.extract;
    } else {
        new_result.error = ERROR_CODE_NO_RESULTS;
    }

    return new_result
}