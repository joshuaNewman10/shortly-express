var db = require('../config');
var Promise = require('bluebird');
var bcrypt = require('bcrypt-nodejs');

var Link = require('./link.js');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  defaults: {
    username: 'demo',
    password: 'demo',
    salt: 'salt'
  },
  links: function() {
    return this.hasMany(Link);
  },
  initialize: function() {
    this.on('creating', this.storePassword);
  },
  storePassword: function() {
    var cipher = Promise.promisify(bcrypt.hash);

    return cipher(this.get('password'), null, null)
      .bind(this)
      .then(function(hash) {
        this.set('password', hash);
      });
  },
  comparePassword: function(enteredPassword, callback) {
   var password = this.get('password');
    bcrypt.compare(enteredPassword, password, function(err, result) {
     callback(result);
   });
  }
});

module.exports = User;


