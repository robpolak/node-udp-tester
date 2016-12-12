var udp = require('dgram');
var server = udp.createSocket('udp4');


var serverController = function(args) {
  this.__args = args;
  this.tests = {};

};

serverController.prototype.start = function() {
  server.bind(this.__args.serverPort, this.__args.serverHost);
  var self = this;
  server.on('listening', function(data){
    self.$__listenEvent(data)
  });
  server.on('message', function(data, remote) {
    self.$__messageEvent(data, remote)
  });
};

serverController.prototype.$__listenEvent = function() {
  var address = server.address();
  console.log('Server listening:' + address.address + ':'+ address.port+ ''.red);
};

serverController.prototype.$__messageEvent = function(data, remote) {
  var req = data.toString();

  try {
    var message = JSON.parse(req);
    message.__remote = remote;
    switch (message.type) {
      case 'testSetup':
        this.$__handleTestStartup(message);
        break;
      case 'udpPing':
        this.$__handleUdpPing(message);
        break;
      default:
        console.log('Case not Handled!'.red);
    }
  } catch (ex) {
    console.log('Error: ' + ex + '!'.red);
  }
};

serverController.prototype.$__handleUdpPing = function(message) {
  if(message.testId) {
    var test = this.tests[message.testId];
    test.currentPing || (test.currentPing = 0);
    var expectedPacket =  test.currentPing + 1;

    var packet = {
      order: message.content.order,
      client_date_sent: message.client_date,
    };

    if(expectedPacket != message.content.order) {
      packet.outOfOrder = true;
    }
    test.currentPing = message.content.order;

    this.$__sendPacket(test.testId, packet, 'udpPingResponse');
  } else {
    console.log("Test Id Missing!".red);
  }
};

serverController.prototype.$__sendPacket = function(testId, packet, type) {
  var config = this.tests[testId];

  var packetContainer = {
    testId: testId,
    type: type,
    server_date: new Date().getTime(),
    content: packet,
  };

  var message = new Buffer(JSON.stringify(packetContainer));
  console.log('Sending Packets to .. ' +  config.__clientConfig.clientHost + ':' + config.__clientConfig.clientPort + ''.green);
  server.send(message, 0, message.length, config.__clientConfig.clientPort, config.__clientConfig.clientHost);
};

serverController.prototype.$__handleTestStartup = function(message) {
  if(message.testId) {
    this.tests[message.testId] = {
      __clientConfig : message.content,
      testId: message.testId,
    };
    var test = this.tests[message.testId];
    console.log('Got testing information.. testId: ' + test.testId + ''.green);
    this.$__sendPacket(test.testId, {}, 'testStart');
  } else {
    console.log("Test Id Missing!".red);
  }


};


module.exports = serverController;