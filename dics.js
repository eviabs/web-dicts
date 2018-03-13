/**
 * Manages the requests.
 */

// Consts
const TERM = "t";
const ERROR_CODE_NO_ERROR = 0; // query executed successfully
const ERROR_CODE_SERVER_ERROR = 1; // remote server error
const ERROR_CODE_NO_RESULTS = 2; // no results

const ERROR = {"error": ERROR_CODE_SERVER_ERROR}; // General error json

const EMPTY = "";

const POST_REQUEST = "POST";
const GET_REQUEST = "GET";

// Includes
var request = require("request");
// var iconv = require('iconv-lite');
var cheerio = require('cheerio'); // https://github.com/cheeriojs/cheerio

module.exports = {

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
        urban_dictionary_url = "http://api.urbandictionary.com/v0/define?term=" + encodeURIComponent(query[TERM]);

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
        morfix_url = "http://services.morfix.com/TranslationHebrew/TranslationService.svc/GetTranslation/";
        morfix_headers = {"Accept": "application/json", "Host": "services.morfix.com", "Content-Type": "application/json"};
        morfix_body = {"Query": encodeURIComponent(query[TERM]),"ClientName":"Android_Hebrew"};

        post_request(res, morfix_url, morfix_headers, morfix_body, function (res, body) {
            res.header("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(morfix_process_result(body), null, 4));
        });

    },

    /**
     * Qwant images
     * API https://api.qwant.com/api/search/images?count=10&offset=1&q={term}
     * Uses the unofficial api.
     *
     * @param query
     * @param res
     */
    images: function (query, res) {
        qwant_images_url = "https://api.qwant.com/api/search/images?count=10&offset=1&q=" + encodeURIComponent(query[TERM]);

        get_request(res, qwant_images_url, function (res, body) {
            res.header("Content-Type", "application/json; charset=utf-8");
            res.end(JSON.stringify(qwant_images_process_result(body), null, 4));
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
    images_google: function (query, res) {
        request({
                url: "https://www.google.com.ua/search?source=lnms&sa=X&gbv=1&tbm=isch&q=" + encodeURIComponent(query[TERM]),
                json: true,
                encoding: null
            },
            function (error, response, body) {
                if (!error && response.statusCode === 200) {
                    // process html source code
                    var results = [];

                    // set the $ object
                    var $ = cheerio.load(body);
                    // console.log($('body').html());
                    $('img').toArray().forEach(function (im) {
                        if (im.attribs.onclick === undefined)
                            results.push(im.attribs.src);
                    });

                    res.header("Content-Type", "application/json; charset=utf-8");
                    res.end(JSON.stringify(results, null, 4));
                } else {
                    res.end(JSON.stringify(ERROR, null, 4));
                }
            });
    },

    /**
     * Morfix using scraping (use the api version if possible!)
     *
     * Reads the html source code, and extracts the definitions.
     * Returns a
     * @param query
     * @param res response object
     */
    morfix_scraping: function (query, res) {
        const TRANSLATE_BOX = "translate_box";
        const WORD = "word";
        const DIBER = "diber";
        const INFLECTION_PH = "inflection_ph";
        const SOUND = "goody";
        const HE_TRANS = "heTrans";
        const SAMPLE_SENTENCES_CONTENT = "sampleSentencesContent";
        const DEFAULT_TRANS = "default_trans";
        const IS_HEBREW = "is_hebrew";

        request({
                url: "http://www.morfix.co.il/" + encodeURIComponent(query[TERM]),
                json: true,
                encoding: null
            },
            function (error, response, body) {

                if (!error && response.statusCode === 200) {
                    // process html source code
                    var results = {};

                    // set the $ object
                    var $ = cheerio.load(body);

                    // iterate over the translations ("translate_boxes")
                    $("[class*=" + TRANSLATE_BOX + "]").each(function (i, elem) {
                        var current = {};

                        // Hebrew word
                        current[WORD] = $(this).find("." + WORD).text();

                        // Diber
                        current[DIBER] = $(this).find("." + DIBER).text();

                        // English word
                        current[DEFAULT_TRANS] = $(this).find("." + DEFAULT_TRANS).text().split(/;|,/g).map(Function.prototype.call, String.prototype.trim);

                        // Optional sound
                        try {
                            if (current[DEFAULT_TRANS] == EMPTY) {
                                current[SOUND] = $(this).find("." + SOUND).html().split('(&apos;').pop().split('&apos;)').shift();
                            }
                            else {
                                current[SOUND] = EMPTY;
                            }
                        }
                        catch (e) {
                            current[SOUND] = EMPTY;
                        }

                        // optional inflections
                        try {
                            current[INFLECTION_PH] = $(this).find("." + INFLECTION_PH).text().replace(/\r|\n|\t/g, "").split("|").map(Function.prototype.call, String.prototype.trim);
                            if (current[INFLECTION_PH].length == 1 && current[INFLECTION_PH][0] == "") {
                                current[INFLECTION_PH] = EMPTY;
                            }
                        }
                        catch (e) {
                            current[INFLECTION_PH] = EMPTY;
                        }

                        // optional sentences examples
                        try {
                            current[SAMPLE_SENTENCES_CONTENT] = $(this).find("." + SAMPLE_SENTENCES_CONTENT).text().replace(/\r|\n|\t/g, "").split("•").map(Function.prototype.call, String.prototype.trim);
                            if (current[SAMPLE_SENTENCES_CONTENT].length == 1 && current[SAMPLE_SENTENCES_CONTENT][0] == "") {
                                current[SAMPLE_SENTENCES_CONTENT] = EMPTY;
                            }
                        }
                        catch (e) {
                            current[SAMPLE_SENTENCES_CONTENT] = EMPTY;
                        }

                        // Hebrew translation
                        current[HE_TRANS] = $(this).find("." + HE_TRANS).text();

                        //console.log($(this).html());
                        results[i] = current;
                    });

                    // Add language in results is not empty
                    if (results != {}) {
                        results[IS_HEBREW] = contains_hebrew_chars(query[TERM]);
                    }

                    res.header("Content-Type", "application/json; charset=utf-8");
                    res.end(JSON.stringify(results, null, 4));
                } else {
                    res.end(JSON.stringify(ERROR, null, 4));
                }
            });
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
            // console.log(body);
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
 * @param body
 */
function default_error(res, body) {
    res.end(JSON.stringify(ERROR, null, 4));
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

    console.log(search_result);
    switch (search_result[status]) {
        // if no results are available, but there are suggestions, push them one by one to the array.
        case "success":
            // iterate over the Words and copy only the needed attributes and omit the rest
            search_result.data.result.items.forEach(function (img) {
                // Words attributes:
                var new_img = {};
                ["media",
                    "thumbnail"].forEach(function (attribute) {
                    new_img[attribute] = img[attribute];
                });

                new_result.images.push(new_img);
            });
            break;

        default:
            new_result.error = ERROR_CODE_NO_RESULTS
    }
    return new_result
}