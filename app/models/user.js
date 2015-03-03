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
  login:  function(password) {
    var model = this;
    var salt = model.get('salt');
    var hash = model.get('password');
    return bcrypt.compareAsync(password, hash)
    .then(function(result) {
      return result;
    });
  },
  initialize: function() {
    this.on('creating', function(model, attrs, options) {
      return bcrypt.genSaltAsync(10).then(function(salt) {
        return bcrypt.hashAsync(model.get('password'), salt, null)
        .then(function(hash) {
          model.set('password', hash);
          model.set('salt', salt);
        });
      });
    });
  }
});

module.exports = User;


