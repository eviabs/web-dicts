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
var request = require("request");
// var iconv = require('iconv-lite');
var cheerio = require('cheerio'); // https://github.com/cheeriojs/cheerio

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
        var urban_dictionary_url = "http://api.urbandictionary.com/v0/define?term=" + encodeURIComponent(query[QUERY_PARAM_TERM]);

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
        var morfix_url = "http://services.morfix.com/TranslationHebrew/TranslationService.svc/GetTranslation/";
        var morfix_headers = {"Accept": "application/json", "Host": "services.morfix.com", "Content-Type": "application/json"};
        var morfix_body = {"Query": encodeURIComponent(query[QUERY_PARAM_TERM]),"ClientName":"Android_Hebrew"};

        post_request(res, morfix_url, morfix_headers, morfix_body, function (res, body) {
            res.header("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(morfix_process_result(body), null, 4));
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
        var count = query[QUERY_PARAM_COUNT];
        count = isNaN(count) ? 10 : count;
        count = count < 1 ? 10 : count;

        var qwant_images_url = "https://api.qwant.com/api/search/images?count=" + count +"&offset=1&q=" + encodeURIComponent(query[QUERY_PARAM_TERM]);

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
        var wikipedia_url = "https://" + lang(query[QUERY_PARAM_TERM]) + ".wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&redirects=1&titles=" + encodeURIComponent(query[QUERY_PARAM_TERM]);

        get_request(res, wikipedia_url, function (res, body) {
            res.header("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(wikipedia_process_result(body), null, 4));
        });
    },

    /**
     * Google images
     *
     * Sraped Google images site.
     * Better no be used without switching ip mechanism!
     * Will result a ban after too many requests.
     *
     * @param query
     * @param res response object
     */
    // images_google: function (query, res) {
    //     request({
    //             url: "https://www.google.com.ua/search?source=lnms&sa=X&gbv=1&tbm=isch&q=" + encodeURIComponent(query[QUERY_PARAM_TERM]),
    //             json: true,
    //             encoding: null
    //         },
    //         function (error, response, body) {
    //             if (!error && response.statusCode === 200) {
    //                 // process html source code
    //                 var results = [];
    //
    //                 // set the $ object
    //                 var $ = cheerio.load(body);
    //                 $('img').toArray().forEach(function (im) {
    //                     if (im.attribs.onclick === undefined)
    //                         results.push(im.attribs.src);
    //                 });
    //
    //                 res.header("Content-Type", "application/json; charset=utf-8");
    //                 res.end(JSON.stringify(results, null, 4));
    //             } else {
    //                 res.end(JSON.stringify(get_error_json(), null, 4));
    //             }
    //         });
    // },

    /**
     * Morfix using scraping (use the api version if possible!)
     *
     * Reads the html source code, and extracts the definitions.
     * Returns a
     * @param query
     * @param res response object
     */
    // morfix_scraping: function (query, res) {
    //     const TRANSLATE_BOX = "translate_box";
    //     const WORD = "word";
    //     const DIBER = "diber";
    //     const INFLECTION_PH = "inflection_ph";
    //     const SOUND = "goody";
    //     const HE_TRANS = "heTrans";
    //     const SAMPLE_SENTENCES_CONTENT = "sampleSentencesContent";
    //     const DEFAULT_TRANS = "default_trans";
    //     const IS_HEBREW = "is_hebrew";
    //
    //     request({
    //             url: "http://www.morfix.co.il/" + encodeURIComponent(query[QUERY_PARAM_TERM]),
    //             json: true,
    //             encoding: null
    //         },
    //         function (error, response, body) {
    //
    //             if (!error && response.statusCode === 200) {
    //                 // process html source code
    //                 var results = {};
    //
    //                 // set the $ object
    //                 var $ = cheerio.load(body);
    //
    //                 // iterate over the translations ("translate_boxes")
    //                 $("[class*=" + TRANSLATE_BOX + "]").each(function (i, elem) {
    //                     var current = {};
    //
    //                     // Hebrew word
    //                     current[WORD] = $(this).find("." + WORD).text();
    //
    //                     // Diber
    //                     current[DIBER] = $(this).find("." + DIBER).text();
    //
    //                     // English word
    //                     current[DEFAULT_TRANS] = $(this).find("." + DEFAULT_TRANS).text().split(/;|,/g).map(Function.prototype.call, String.prototype.trim);
    //
    //                     // Optional sound
    //                     try {
    //                         if (current[DEFAULT_TRANS] == EMPTY) {
    //                             current[SOUND] = $(this).find("." + SOUND).html().split('(&apos;').pop().split('&apos;)').shift();
    //                         }
    //                         else {
    //                             current[SOUND] = EMPTY;
    //                         }
    //                     }
    //                     catch (e) {
    //                         current[SOUND] = EMPTY;
    //                     }
    //
    //                     // optional inflections
    //                     try {
    //                         current[INFLECTION_PH] = $(this).find("." + INFLECTION_PH).text().replace(/\r|\n|\t/g, "").split("|").map(Function.prototype.call, String.prototype.trim);
    //                         if (current[INFLECTION_PH].length == 1 && current[INFLECTION_PH][0] == "") {
    //                             current[INFLECTION_PH] = EMPTY;
    //                         }
    //                     }
    //                     catch (e) {
    //                         current[INFLECTION_PH] = EMPTY;
    //                     }
    //
    //                     // optional sentences examples
    //                     try {
    //                         current[SAMPLE_SENTENCES_CONTENT] = $(this).find("." + SAMPLE_SENTENCES_CONTENT).text().replace(/\r|\n|\t/g, "").split("•").map(Function.prototype.call, String.prototype.trim);
    //                         if (current[SAMPLE_SENTENCES_CONTENT].length == 1 && current[SAMPLE_SENTENCES_CONTENT][0] == "") {
    //                             current[SAMPLE_SENTENCES_CONTENT] = EMPTY;
    //                         }
    //                     }
    //                     catch (e) {
    //                         current[SAMPLE_SENTENCES_CONTENT] = EMPTY;
    //                     }
    //
    //                     // Hebrew translation
    //                     current[HE_TRANS] = $(this).find("." + HE_TRANS).text();
    //
    //                     results[i] = current;
    //                 });
    //
    //                 // Add language in results is not empty
    //                 if (results !== {}) {
    //                     results[IS_HEBREW] = contains_hebrew_chars(query[QUERY_PARAM_TERM]);
    //                 }
    //
    //                 res.header("Content-Type", "application/json; charset=utf-8");
    //                 res.end(JSON.stringify(results, null, 4));
    //             } else {
    //                 res.end(JSON.stringify(get_error_json(ERROR_CODE_SERVER_ERROR), null, 4));
    //             }
    //         });
    // },

    /**
     * Checks that the query contains all only allowed params
     *
     * @param query
     * @param allowed_params
     * @returns {boolean}
     */
    validate_query: function (query, allowed_params) {
    var res = true;
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
var contains_hebrew_chars = function (str) {
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
var lang = function (str) {
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
    var headers = {"User-Agent": "Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:47.0) Gecko/20100101 Firefox/47.0"};
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
    var new_result = {
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
                var new_word = {};
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
    var new_result = {
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
                var new_word = {};
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
    var new_result = {
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
                var new_img = {};
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
    var new_result = {
        error: ERROR_CODE_NO_ERROR,
        title: "",
        extract: ""
    };


    var first_result = (search_result.query === undefined) ? undefined : search_result.query.pages[Object.keys(search_result.query.pages)[0]];

    // if missing attribute is present, then no results found
    if (first_result !== undefined && first_result.missing === undefined) {
        new_result.title = first_result.title;
        new_result.extract = first_result.extract;
    } else {
        new_result.error = ERROR_CODE_NO_RESULTS;
    }

    return new_result
}