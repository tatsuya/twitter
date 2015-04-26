# twitter

Twitter-like application, built with [Node][node] and [Redis][redis].

## Live demo

https://twitterlikeapp.herokuapp.com/

## Development

### Download project

First, clone this repository. When download finished, move into the project directy then run:

```
$ npm install
```

This will install all required dependent modules.

### Install Redis

Since this application requires Redis installed on your machine, you'll need to install it. For Mac OSX, the most easiest way would be using [Homebrew][homebrew].

```
$ brew install redis
```

Otherwise, please check [Redis's official documentaiton][redis] out.

### Start application

This application is based on [Express][express] framework. To start the application, run:

```
$ npm start
```

It will serve application at `http://localhost:3000/`.

## Deployment

For deployment, `Procfile` is packaged as a default default configuration for integration with Heroku. If you are not familiar with Heroku I would recommend you to first read through the documentation of [how to get started with Node.js on Heroku][heroku-getting-started-with-node].

The whole deployment process should be as simple as the follwing three steps.

Login to Heroku:

```
$ heroku login
````

Create an app on Heroku:

```
$ heroku create
```

Deploy an app:

```
$ git push heroku master
```

## Author

Tatsuya Oiwa

[node]: https://nodejs.org/
[redis]: http://redis.io/
[homebrew]: http://brew.sh/
[express]: http://expressjs.com/
[heroku-getting-started-with-node]: https://devcenter.heroku.com/articles/getting-started-with-nodejs#introduction
