var express = require('express');
var session = require('express-session');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();
app.use(cookieParser());
app.use(session({secret:'supernova', saveUninitialized: true, resave: true})); //dunno
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));
// app.use(app.router);



app.get('/', checkSession, function(req, res) {
   res.render('index');
});

app.get('/create', checkSession, function(req, res) {
    res.render('index');
});

app.get('/links', checkSession, function(req, res) {
    Links.reset().fetch(  ).then(function(links) {
      res.send(200, links.models);
    });
});

app.get('/index',checkSession, function(req, res) {
    res.render('index');
});








/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', function(req, res) {
  res.render('login');
});

app.get('/signup', function(req,res){
  res.render('signup');
});

app.post('/login', function(req, res) {
  var name = req.body.username;
  var password = req.body.password;
  console.log(name, password);
  //look in database for that user
  new User({username: name}).fetch().then(function(user) {
    if( user ) { //user exists
      user.comparePassword(password, function(success) {
        if( success ) { //user exists and correct password
          createSession(req, res, user);
          res.render('index');
        } else { //user exists but wrong password
          res.redirect('/signup');
        }
      });
    } else { //user doesnt exist
      console.log('user not found');
      res.redirect('/signup');
      }
  });
  //if found that user
  //  check users passed in password
  //  check not already logged in
  //  //if match
  //    //redirect to index
  //  //else
  //    //send to signup page

});


app.post('/signup', function (req,res){
  var name = req.body.username;
  var password = req.body.password;

  new User({username:name }).fetch().then(function(user){
    if ( user ){
      res.redirect('/login');
    } else {
      var user = new User({
        username: name,
        password: password
      });
      user.save().then(function(savedUser){
        console.log('made new user, in save');
        Users.add(savedUser);
        createSession(req, res, savedUser);
        res.render('index');
      });
    }
  });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;
  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      console.log('successfully found the url');
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
// Write your authentication Functions here
/************************************************************/

function checkUser(user, password) {
  var verified = false;
  new User({username: user}).fetch().then(function(found) {
    if ( found ) {
      console.log('found the user', found);
      verified = found.login(password);
      console.log(verified);
      if ( verified ) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  });
}

function checkSession(req, res, next) {
  var logged = req.session ? !!req.session.user : false;
  if( logged ) {
    next();
  } else {
    res.redirect('/login');
  }
}

function logOut(request, response) {
  if(request.url === '/logout'){
    req.session.destroy(function() {
      console.log('user been logged out');
      res.redirect('/login');
    });
  }
}

function createSession(req, res, user) {
  return req.session.regenerate(function() {
    req.session.user = user;
  });
}
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

console.log('Shortly is listening on 4568');
app.listen(4568);
