const { SqliteDatabase } = require('../Common.Services/dbHandler').default;
const Tables = require('../../Constants/Tables');
const SharedService = require('../Common.Services/SharedService');
const settings = require('../../settings.json').settings;

class SupplierService {
  constructor(message) {
    this.message = message;
    this.db = new SqliteDatabase(settings.dbPath);
  }

  async createSupplier() {
    const d = this.message.data || {};
    const data = {
      Name: d.name,
      Email: d.email || null,
      Phone: d.phone || null,
      Address: d.address || null,
      ConcurrencyKey: SharedService.generateConcurrencyKey()
    };
    this.db.open();
    try {
      const res = await this.db.insertValue(Tables.SUPPLIERS, data);
      return { success: { id: res.lastId } };
    } finally { this.db.close(); }
  }

  async getSupplierById() {
    const id = this.message.data?.id;
    this.db.open();
    try {
      const row = await this.db.findById(Tables.SUPPLIERS, id);
      if (!row) return { error: { code: 404, message: 'Not Found' } };
      return { success: row };
    } finally { this.db.close(); }
  }

  async listSuppliers() {
    this.db.open();
    try {
      const rows = await this.db.runSelectQuery(`SELECT * FROM ${Tables.SUPPLIERS} ORDER BY Id DESC`);
      return { success: rows };
    } finally { this.db.close(); }
  }

  async updateSupplier() {
    const d = this.message.data || {};
    if (!d.id) return { error: { code: 400, message: 'id is required' } };
    const upd = {};
    if (d.name !== undefined) upd.Name = d.name;
    if (d.email !== undefined) upd.Email = d.email;
    if (d.phone !== undefined) upd.Phone = d.phone;
    if (d.address !== undefined) upd.Address = d.address;
    upd.LastUpdatedOn = null; // keep default
    this.db.open();
    try {
      const res = await this.db.updateValue(Tables.SUPPLIERS, upd, { Id: d.id });
      return { success: { changes: res.changes } };
    } finally { this.db.close(); }
  }

  async deleteSupplier() {
    const id = this.message.data?.id;
    if (!id) return { error: { code: 400, message: 'id is required' } };
    this.db.open();
    try {
      const res = await this.db.deleteValues(Tables.SUPPLIERS, { Id: id });
      return { success: { changes: res.changes } };
    } finally { this.db.close(); }
  }
}

module.exports = SupplierService;
