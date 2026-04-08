const { SqliteDatabase } = require('../Common.Services/dbHandler').default;
const Tables = require('../../Constants/Tables');
const SharedService = require('../Common.Services/SharedService');
const settings = require('../../settings.json').settings;

class POService {
  constructor(message) { this.message = message; this.db = new SqliteDatabase(settings.dbPath); }

  async createPO() {
    const d = this.message.data || {};
    if (!d.supplierId) return { error: { code: 400, message: 'supplierId is required' } };
    const data = {
      SupplierId: d.supplierId,
      Status: d.status || 'Draft',
      DueDate: d.dueDate || null,
      Notes: d.notes || null,
      ConcurrencyKey: SharedService.generateConcurrencyKey()
    };
    this.db.open();
    try {
      const res = await this.db.insertValue(Tables.PURCHASEORDERS, data);
      return { success: { id: res.lastId } };
    } finally { this.db.close(); }
  }

  async addItem() {
    const d = this.message.data || {};
    if (!d.poId) return { error: { code: 400, message: 'poId is required' } };
    if (!d.itemName || d.quantity == null || d.unitPrice == null) return { error: { code: 400, message: 'itemName, quantity, unitPrice required' } };
    const data = { PurchaseOrderId: d.poId, ItemName: d.itemName, Quantity: d.quantity, UnitPrice: d.unitPrice };
    this.db.open();
    try {
      const res = await this.db.insertValue(Tables.PURCHASEORDERITEMS, data);
      return { success: { id: res.lastId } };
    } finally { this.db.close(); }
  }

  async updateStatus() {
    const d = this.message.data || {};
    if (!d.poId || !d.status) return { error: { code: 400, message: 'poId and status required' } };
    this.db.open();
    try {
      const res = await this.db.updateValue(Tables.PURCHASEORDERS, { Status: d.status }, { Id: d.poId });
      return { success: { changes: res.changes } };
    } finally { this.db.close(); }
  }

  async getById() {
    const id = this.message.data?.id;
    this.db.open();
    try {
      const po = await this.db.findById(Tables.PURCHASEORDERS, id);
      if (!po) return { error: { code: 404, message: 'Not Found' } };
      const items = await this.db.runSelectQuery(`SELECT * FROM ${Tables.PURCHASEORDERITEMS} WHERE PurchaseOrderId = ?`, [id]);
      return { success: { po, items } };
    } finally { this.db.close(); }
  }

  async listPOs() {
    this.db.open();
    try {
      const rows = await this.db.runSelectQuery(`SELECT * FROM ${Tables.PURCHASEORDERS} ORDER BY Id DESC`);
      return { success: rows };
    } finally { this.db.close(); }
  }
}

module.exports = POService;
