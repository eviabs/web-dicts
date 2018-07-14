let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let morgan = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');
let colors = require('./mycolors')

let index = require('./routes/index');
// var users = require('./routes/users');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// morgan ref: https://github.com/expressjs/morgan
// app.use(morgan('dev'));

app.use(morgan(function (tokens, req, res) {
    return [
        colors.FgYellow + "(",
        tokens['remote-addr'](req, res),
        ")",
        colors.Reset + (new Date).toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        colors.FgCyan + tokens.method(req, res),
        colors.FgBlue + decodeURIComponent(tokens.url(req, res)),
        ((tokens.status(req, res) !== 200) ? colors.FgGreen : colors.FgRed) + "status=" + tokens.status(req, res),
        colors.FgMagenta + tokens['response-time'](req, res), 'ms',
        tokens['user-agent'](req, res) + colors.Reset
    ].join(' ')
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
// app.use('/users', users);

// Only this command is valid
app.use('/dic/:id', function (req, res, next) {

    let dics = require('./dics.js');
    let search_in_dic = undefined;

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
