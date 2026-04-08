const sqlite3 = require('sqlite3').verbose();

const DataTypes = { TEXT: 'TEXT', INTEGER: 'INTEGER', NULL: 'NULL' };

class SqliteDatabase {
  constructor(dbFile) { this.dbFile = dbFile; this.openConnections = 0; this.db = null; }

  open() {
    if (this.openConnections <= 0) { this.db = new sqlite3.Database(this.dbFile); this.openConnections = 1; }
    else this.openConnections++;
  }

  close() {
    if (this.openConnections <= 1) { if (this.db) this.db.close(); this.db = null; this.openConnections = 0; }
    else this.openConnections--;
  }

  runQuery(query, params = null) {
    return new Promise((resolve, reject) => {
      this.db.run(query, params ? params : [], function (err) {
        if (err) return reject(err);
        resolve({ lastId: this.lastID, changes: this.changes });
      });
    });
  }

  runSelectQuery(query, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async getLastRecord(tableName) {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT * FROM ${tableName} ORDER BY rowid DESC LIMIT 1`, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  async insertValue(tableName, value) { return this.insertValues(tableName, [value]); }

  async insertValues(tableName, values) {
    const columnNames = Object.keys(values[0]);
    let rowValueStr = '';
    const rowValues = [];
    for (const val of values) {
      rowValueStr += '(';
      for (const cn of columnNames) { rowValueStr += '?,'; rowValues.push(val[cn] ?? null); }
      rowValueStr = rowValueStr.slice(0, -1) + '),';
    }
    rowValueStr = rowValueStr.slice(0, -1);
    const query = `INSERT INTO ${tableName}(${columnNames.join(', ')}) VALUES ${rowValueStr}`;
    return this.runQuery(query, rowValues);
  }

  async updateValue(tableName, value, filter = null) {
    const cols = Object.keys(value);
    let setStr = cols.map((c) => `${c} = ?`).join(', ');
    const vals = cols.map((c) => value[c] ?? null);
    let filterStr = '1';
    if (filter) {
      const fcols = Object.keys(filter);
      if (fcols.length > 0) {
        filterStr = fcols.map((c) => `${c} = ?`).join(' AND ');
        vals.push(...fcols.map((c) => filter[c] ?? null));
      }
    }
    const q = `UPDATE ${tableName} SET ${setStr} WHERE ${filterStr};`;
    return this.runQuery(q, vals);
  }

  async deleteValues(tableName, filter = null) {
    let filterStr = '1';
    const vals = [];
    if (filter) {
      const fcols = Object.keys(filter);
      if (fcols.length > 0) {
        filterStr = fcols.map((c) => `${c} = ?`).join(' AND ');
        vals.push(...fcols.map((c) => filter[c] ?? null));
      }
    }
    return this.runQuery(`DELETE FROM ${tableName} WHERE ${filterStr};`, vals);
  }

  async findById(tableName, id) {
    return new Promise((resolve, reject) => {
      this.db.get(`SELECT * FROM ${tableName} WHERE Id = ?`, [id], (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }
}

module.exports = { default: { SqliteDatabase, DataTypes }, SqliteDatabase, DataTypes };
