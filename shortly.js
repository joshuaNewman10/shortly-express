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




var userStore = {
  'josh': 'password'
};
//------------------------------------------------//

var logged = false;

app.get('/', function(req, res) {
  if( logged ) {
    res.redirect('/index');
  } else {
    res.redirect('/login');
  }
});

app.get('/create', function(req, res) {
  if( logged ) {
    res.render('index');
  } else {
    res.redirect('/login');
  }
});

app.get('/links', function(req, res) {
  if( logged ) {
    Links.reset().fetch(  ).then(function(links) {
      res.send(200, links.models);
    });
  } else {
    res.redirect('/login');
  }
});

app.get('/signup', function(req,res){
  res.render('signup');
});

app.get('/index', function(req, res) {
  if( logged ) {
    res.render('index');
  } else {
    res.redirect('/login');
  }
});

app.get('/login', function(req, res) {
  res.render('login');
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

app.post('/login', function(req, res) {
  // req.session.data.user='test';
  console.log('current sesssion', req.session, req.cookies);

  if ( sameSession(req) ) {
    logged = true;
    res.render('index');
  }
  var user = req.body.username;
  var password = req.body.password;
  var verified = false;
  if ( !userStore[user] ) {
    res.redirect('/signup');
  } else {
    console.log('about to check user');
    verified = checkUser(user, password);
  }

  if( verified ) {
    logged = true; //user now logged in
    res.render('index');
  } else {
    res.redirect('/login');
  }

});


app.post('/signup', function (req,res){
  var name = req.body.username;
  var password = req.body.password;
  // userStore[user] = password;
  // logged = true;
  //
  new User({username:name, password: password}).fetch().then(function(user){
    if (user){
      res.redirect('/signup');
    } else if (!user){
      var user = new User({
        username: name,
        password: password
      });
      user.save().then(function(savedUser){
        Users.add(savedUser);
        console.log('added a new user');
        // res.send(200,user);
        res.redirect('/index');
      });
    }
  });
});

  // var user = new User({
  //   username: user,
  //   password: password,
  // });
  // user.save().then(function(user) {
  //   Users.add(user);
  //   console.log('added a new user');
  //   // res.send(200, user);
  //   res.redirect('/index');
  // });

/************************************************************/
// Write your authentication routes here
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

function loggedIn() {
  return logged;
}

function sameSession(req) {
  return req.session ===  session;
}

function logOut(request, response) {
  if(request.url === '/logout'){
    request.session.data.user = "Guest";
    response.writeHead(200, {'Content-Type': 'text/plain'});
    response.write('You\'ve been logged out');
    response.end();
    return;
  }
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
