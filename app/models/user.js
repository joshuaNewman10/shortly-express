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
        // bcrypt.hash(attrs.password, salt, function(err, hash) {
        // Store hash in your password DB.
        console.log('hash and salt', salt);
          // model.set('password', hash);
          model.set('salt', salt);
        // });
      });
    });
  },
});

module.exports = User;


