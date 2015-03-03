var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link = require('./link.js');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  defaults: {
    salt: 'a'
  },
  links: function() {
    return this.hasMany(Link);
  },
  initialize: function() {
    this.on('creating', function(model, attrs, options) {
       bcrypt.genSalt(10, function(err, salt) {
          bcrypt.hash(model.get('password'), salt, null, function(err, hash) {
              model.set('password' , hash
              model.set('salt', salt);
          });
      });
    });
  }
},{
 login: function(password) {
  console.log('in login');
  var model = this;
  var salt = model.get('salt');
  var hash = model.get('password');
  bcrypt.compare(password, hash, function(err, res) {
      return res;
  });

 }
});
module.exports = User;


