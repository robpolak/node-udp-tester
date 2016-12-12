var arugmentController = require('./src/controllers/argumentController');
var colors = require('colors');

var args = arugmentController.getArgs();

if(args.server) {
  var serverController = require('./src/controllers/serverController');
  var server = new serverController(args);
  server.start();
}

if(args.client) {
  var clientController = require('./src/controllers/clientController');
  var client = new clientController(args);
  client.start();
}