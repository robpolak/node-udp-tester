var udp = require('dgram');
var socket = udp.createSocket('udp4');
var util = require('./util');
var moment = require('moment');

var clientController = function(args) {
  this.__args = args;
  this.__testId = util.randomString(15);
  this.testResults = {};
};

clientController.prototype.start = function() {
  socket.bind(this.__args.clientPort, this.__args.clientHost);

  socket.on('listening', function(data){
    self.$__listenEvent(data)
  });
  socket.on('message', function(data, remote) {
    self.$__messageEvent(data, remote)
  });

  var self = this;
  setTimeout(function() {
    self.$__sendTestConfig();
  }, this.__args.startDelay);
};

clientController.prototype.$__sendTestConfig = function() {
  var testConfig = this.__args;
  this.$__sendPacket(testConfig, 'testSetup');
};

clientController.prototype.$__sendPacket = function(packet, type) {
  var packetContainer = {
    testId: this.__testId,
    type: type,
    client_date: new Date().getTime(),
    content: packet,
  };

  var message = new Buffer(JSON.stringify(packetContainer));
  console.log('Sending Packets to .. ' + this.__args.serverHost + ':' + this.__args.serverPort + ''.green);
  socket.send(message, 0, message.length, this.__args.serverPort, this.__args.serverHost);
};

clientController.prototype.$__listenEvent = function() {
  var address = socket.address();
  console.log('Client listening:' + address.address + ':'+ address.port+ ''.red);
};

clientController.prototype.$__messageEvent = function(data, remote) {
  var req = data.toString();

  try {
    var message = JSON.parse(req);
    message.__remote = remote;
    switch (message.type) {
      case 'testStart':
        this.$__handleTestStart(message);
        break;
      case 'udpPingResponse':
        this.$__handleUdpPingReponse(message);
        break;
      default:
        console.log('Case not Handled!'.red);
    }
  } catch (ex) {
    console.log('Error: ' + ex + '!'.red);
  }
};

clientController.prototype.$__handleTestStart = function() {
  this.testResults = {};
  switch(this.__args.testType) {
    case 'udpPing':
      this.$__runUdpPing();
      break;
    default:
      console.log('Test Type Not Defined!'.red);
  }
};

clientController.prototype.$__handleUdpPingReponse = function(message) {
  this.testResults.pings || (this.testResults.pings = []);
  if(message.content.outOfOrder) {
    console.log('Out Of order udp packet!'.red);
  }
  var now = moment();
  var sentDate = moment(new Date(message.content.client_date_sent));
  var rtt = now.diff(sentDate, 'ms');
  console.log('UDP Ping Response: '+ rtt + ' ms'.green);
  this.testResults.pings.push(message);
};

clientController.prototype.$__runUdpPing = function() {
  this.testResults.pingOrder = 1;
  this.$__runUdpPing_sendPings();
};

clientController.prototype.$__runUdpPing_sendPings = function() {
  var self = this;
  this.$__sendPacket({
    order: this.testResults.pingOrder,
  }, 'udpPing');
  this.testResults.pingOrder += 1;
  if(this.testResults.pingOrder < this.__args.count) {
    setTimeout(function () {
      self.$__runUdpPing_sendPings();
    }, this.__args.delay);
  } else {
    console.log('test done!'.green);
  }
}

module.exports = clientController;