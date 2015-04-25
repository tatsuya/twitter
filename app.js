'use strict';

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var flash = require('./lib/middleware/flash');
var auth = require('./lib/middleware/auth');
var user = require('./lib/middleware/user');

var User = require('./lib/user');

var routes = require('./routes/index');
var register = require('./routes/register');
var login = require('./routes/login');
var logout = require('./routes/logout');
var entries = require('./routes/entries');
var users = require('./routes/users');
var settings = require('./routes/settings');
var post = require('./routes/post');
var api = require('./routes/api');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'topsecret'
}));
app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', auth(User.authenticate, 'shoutbox'));
app.use(user());

app.use('/api', api);
app.use('/register', register);
app.use('/login', login);
app.use('/logout', logout);
app.use('/post', post);
app.use('/entries', entries);
app.use('/users', users);
app.use('/settings', settings);
app.use('/', routes);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res) {
        var data = {
            message: err.message,
            error: err
        };
        res.status(err.status || 500);
        res.format({
            html: function() {
                res.render('error', data);
            },
            json: function() {
                res.send(data);
            }
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res) {
    var data = {
        message: err.message,
        error: {}
    };
    res.status(err.status || 500);
    res.format({
        html: function() {
            res.render('error', data);
        },
        json: function() {
            res.send(data);
        }
    });
});


module.exports = app;
