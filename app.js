var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
// var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
// app.use('/users', users);

// Only this command is valid
app.use('/dic/:id', function (req, res, next) {

    var dics = require('./dics.js');
    var search_in_dic = undefined;

    // first, check if the dictionary available
    switch (req.params.id.toLowerCase()) {
        case "urban":
            search_in_dic = dics.urban_dictionary;
            break;

        case "milog":
            search_in_dic = dics.milog;
            break;

        case "morfix":
            search_in_dic = dics.morfix;
            break;

        case "wikipedia":
            search_in_dic = dics.wikipedia;

            break;


        case "images":
            search_in_dic = dics.images;
            break;

        default:
            res.status(400);
            res.end(JSON.stringify(dics.get_error_json(dics.ERROR_CODE_NO_SUCH_DIC), null, 4));
            return;
    }

    // then, make sure that query is fine (at this moment, all queries look the same!)
    if (!dics.validate_query(req.query, [dics.QUERY_PARAM_TERM, dics.QUERY_PARAM_COUNT])) {
        res.status(400);
        res.end(JSON.stringify(dics.get_error_json(dics.ERROR_CODE_BAD_QUERY), null, 4));
        return;
    }

    // only then run the middleware
    search_in_dic(req.query, res);

});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  // var err = new Error('Not Found');
  // err.status = 404;
  // next(err);

    res.status(404);
    res.end("not found");
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
