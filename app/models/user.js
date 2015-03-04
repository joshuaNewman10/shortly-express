var db = require('../config');
var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));

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
    var cipher = bcrypt.hash;
    var password = this.get('password');

    return cipher(password, null, null
      .bind(this)
      .then(function(hash) {
        this.set('password', hash);
      });
  },
  comparePassword: function(enteredPassword, callback) {

   var password = this.get('password');
   return bsync.compare(password, enteredPassword, function(err, result) {
     return callback(result)
   });
  }
});

module.exports = User;


