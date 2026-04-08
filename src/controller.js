const ServiceTypes = require('./Constants/ServiceTypes');
const SupplierController = require('./Controllers/Supplier.Controller');
const POController = require('./Controllers/PO.Controller');
const UpgradeController = require('./Controllers/Upgrade.Controller');

class Controller {
  async handleRequest(user, message, isReadOnly) {
    let result = {};
    try {
      if (message.Data && !message.data) message.data = message.Data; // normalize
      const svc = message.Service;
      if (svc === ServiceTypes.SUPPLIER) {
        const ctrl = new SupplierController(message);
        result = await ctrl.handleRequest();
      } else if (svc === ServiceTypes.PURCHASE_ORDER) {
        const ctrl = new POController(message);
        result = await ctrl.handleRequest();
      } else if (svc === ServiceTypes.UPGRADE) {
        const ctrl = new UpgradeController(message);
        result = await ctrl.handleRequest(user);
      } else {
        result = { error: { code: 400, message: 'Invalid service' } };
      }
    } catch (e) {
      result = { error: { code: 500, message: 'Internal error', details: e?.message || e } };
    }

    const response = message.promiseId ? { promiseId: message.promiseId, ...result } : result;
    await user.send(response);
  }
}

module.exports = Controller;
