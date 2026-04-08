const SupplierService = require('../Services/Domain.Services/Supplier.service');

class SupplierController {
  constructor(message) { this.message = message; this.service = new SupplierService(message); }

  async handleRequest() {
    const action = this.message.Action;
    try {
      switch (action) {
        case 'CreateSupplier': return await this.service.createSupplier();
        case 'GetSupplierById': return await this.service.getSupplierById();
        case 'ListSuppliers': return await this.service.listSuppliers();
        case 'UpdateSupplier': return await this.service.updateSupplier();
        case 'DeleteSupplier': return await this.service.deleteSupplier();
        default: return { error: { code: 400, message: 'Invalid action' } };
      }
    } catch (e) { return { error: { code: 500, message: 'Internal error', details: e?.message || e } }; }
  }
}

module.exports = SupplierController;
