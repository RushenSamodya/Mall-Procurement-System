const POService = require('../Services/Domain.Services/PO.service');

class POController {
  constructor(message) { this.message = message; this.service = new POService(message); }

  async handleRequest() {
    const action = this.message.Action;
    try {
      switch (action) {
        case 'CreatePO': return await this.service.createPO();
        case 'AddItem': return await this.service.addItem();
        case 'UpdateStatus': return await this.service.updateStatus();
        case 'GetPOById': return await this.service.getById();
        case 'ListPOs': return await this.service.listPOs();
        default: return { error: { code: 400, message: 'Invalid action' } };
      }
    } catch (e) { return { error: { code: 500, message: 'Internal error', details: e?.message || e } }; }
  }
}

module.exports = POController;
