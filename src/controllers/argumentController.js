var argumentController = function() {
  this.arguments = require('minimist')(process.argv.slice(2));
  global.__arguments = this.arguments;

  this.env = process.env.node_env;

  this.defaults = {
    udpPacketSize : 1900,
    count: 1000,
    delay: 1,
    serverHost: '127.0.0.1',
    clientHost: '127.0.0.1',
    testType: 'udpPing',
    clientPort: '35123',
    startDelay: 100,
  };

  //Set Defaults
  for(var prop in this.defaults) {
    if(typeof this.arguments[prop] === 'undefined') {
      this.arguments[prop] = this.defaults[prop];
    }
  }


};

argumentController.prototype.getArgs = function() {
  if(!this.$__validateArguments()) {
    this.printArgs();
    return null;
  }
  return this.arguments;
};

argumentController.prototype.printArgs = function() {
  console.log('-------------------UDP Test Tool-------------------');
};

argumentController.prototype.$__validateArguments = function() {
  var valid = true;

  if(!this.arguments.client && !this.arguments.server) {
    console.log('Must Specify Client and/or Server Configuration');
    valid = false;
  }

  if(this.arguments.client && !this.arguments.clientPort) {
    console.log('Must Specify Client Port!');
    valid = false;
  }

  if(this.arguments.server && !this.arguments.serverPort) {
    console.log('Must Specify Server Port!');
    valid = false;
  }


  return valid;
};



module.exports = new argumentController();