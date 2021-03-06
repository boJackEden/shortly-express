var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');


var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
app.use(cookieParser('shh'));
app.use(session({
  genid: function(req) {
    return 'hello';
  },
  resave: true,
  saveUninitialized: true,
  secret: 'shhhhhhh'
}));

// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));



app.get('/',
function(req, res) {
  sess = req.session;

    if(!sess.username){
      res.redirect('login');
    } else {
      res.render('index');
    }

});

app.get('/create',
function(req, res, next) {
  sess = req.session;

    if(!sess.username){
      res.redirect('login');
    } else {
      next();
    }

},
function(req, res) {
  res.render('index');
}
);

app.get('/links',
function(req, res) {
  sess = req.session;
  if(!sess.username){
    res.redirect('login');
  } else {
    console.log(req.url);
    Links.reset().fetch().then(function(links) {
      res.send(200, links.models);
    });
  }
});

app.post('/links',
function(req, res) {
  //console.log('app.post /links',req.body.url);
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }
  sess = req.session;
  //console.log("this should be the seession : ", sess);
  if(!sess){
    res.redirect('login');
    return;
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login',
function(req, res) {
  //console.log('in login GET');
  res.render('login');
});

app.post('/login',
function(req, res) {
  //console.log('in login POST');
  sess = req.session;
  sess.username = req.body.username;
  sess.password = req.body.password;

  res.redirect('/create');
  // res.send(302);
});

app.post('/signup',
function(req, res) {

  sess = req.session;
  var username = req.body.username;
  var password = req.body.password;
  Users.query(function(data){
    data.where('username', '=', username )
  }).fetch().then(function(data){
    if(data.length > 0){
      res.redirect('signup');
    } else {
      var newUser = new User({
        'username': username,
        'password': password
      }).save().then(function(params){
        sess.username = username;
        console.log(params);
        res.redirect('index');
      });
    }
  })
  // res.redirect('index');
});

app.get('/signup',
function(req, res) {
  //console.log('in signup GET');
  res.render('signup');
});

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 3000');
app.listen(3000);
