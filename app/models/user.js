var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  'username':'username',
  'password':'password'
});

module.exports = User;
