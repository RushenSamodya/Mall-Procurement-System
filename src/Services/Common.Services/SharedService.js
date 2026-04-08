const EventEmitter = require('events');

const SharedService = {
  context: null,
  nplEventEmitter: new EventEmitter(),
  getUtcISOStringFromUnixTimestamp: function (milliseconds) {
    const date = new Date(milliseconds);
    return date.toISOString();
  },
  getCurrentTimestamp: function () {
    return SharedService.getUtcISOStringFromUnixTimestamp(SharedService.context?.timestamp || Date.now());
  },
  generateConcurrencyKey: function () {
    const timestamp = SharedService.getCurrentTimestamp();
    const extracted = timestamp.replace(/\D/g, '');
    const hex = Number(extracted).toString(16).toUpperCase().padStart(14, '0');
    const checksum = 16 - hex.length;
    return `0x${'0'.repeat(checksum)}${hex}`;
  }
};

module.exports = SharedService;
