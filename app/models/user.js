var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');
var Link = require('./link.js');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  links: function() {
    return this.hasMany(Link);
  },
  // initialize: function() {
  //   this.on('creating', function(model, attrs, options) {
  //     var password = model.get('password');
  //     // bcrypt.genSalt(10, function(err, salt) {
  //     //   bcrypt.hash(password, salt, function(err, hash) {
  //     //   // Store hash in your password DB.
  //     //     model.set('password', hash);
  //     //   });
  //     // });
  //   });
  // },
});

module.exports = User;


