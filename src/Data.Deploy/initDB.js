const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const settings = require('../settings.json').settings;
const Tables = require('../Constants/Tables');
const SharedService = require('../Services/Common.Services/SharedService');

class DBInitializer {
  static #db = null;

  static async init() {
    if (!fs.existsSync(settings.dbPath)) {
      this.#db = new sqlite3.Database(settings.dbPath);
      await this.#runQuery('PRAGMA foreign_keys = ON');

      await this.#runQuery(`CREATE TABLE IF NOT EXISTS ${Tables.CONTRACTVERSION} (
        Id INTEGER,
        Version FLOAT NOT NULL,
        Description TEXT,
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        LastUpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY('Id' AUTOINCREMENT)
      )`);

      await this.#runQuery(`CREATE TABLE IF NOT EXISTS ${Tables.SQLSCRIPTMIGRATIONS} (
        Id INTEGER,
        Sprint TEXT NOT NULL,
        ScriptName TEXT NOT NULL,
        ExecutedTimestamp TEXT,
        ConcurrencyKey TEXT,
        PRIMARY KEY('Id' AUTOINCREMENT)
      )`);

      await this.#runQuery(`CREATE TABLE IF NOT EXISTS ${Tables.ACTIVITYLOG} (
        Id INTEGER,
        ActivityType TEXT,
        Message TEXT,
        ExceptionMessage TEXT,
        TimeStamp TEXT,
        PRIMARY KEY('Id' AUTOINCREMENT)
      )`);

      await this.#runQuery(`CREATE TABLE IF NOT EXISTS ${Tables.SUPPLIERS} (
        Id INTEGER,
        Name TEXT NOT NULL,
        Email TEXT,
        Phone TEXT,
        Address TEXT,
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        LastUpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        ConcurrencyKey TEXT,
        PRIMARY KEY('Id' AUTOINCREMENT)
      )`);

      await this.#runQuery(`CREATE TABLE IF NOT EXISTS ${Tables.PURCHASEORDERS} (
        Id INTEGER,
        SupplierId INTEGER NOT NULL,
        Status TEXT DEFAULT 'Draft',
        DueDate DATETIME,
        Notes TEXT,
        CreatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        LastUpdatedOn DATETIME DEFAULT CURRENT_TIMESTAMP,
        ConcurrencyKey TEXT,
        PRIMARY KEY('Id' AUTOINCREMENT)
      )`);

      await this.#runQuery(`CREATE TABLE IF NOT EXISTS ${Tables.PURCHASEORDERITEMS} (
        Id INTEGER,
        PurchaseOrderId INTEGER NOT NULL,
        ItemName TEXT NOT NULL,
        Quantity INTEGER NOT NULL,
        UnitPrice FLOAT NOT NULL,
        PRIMARY KEY('Id' AUTOINCREMENT)
      )`);

      this.#db.close();
    }

    if (fs.existsSync(settings.dbPath)) {
      this.#db = new sqlite3.Database(settings.dbPath);
      const getLastExecutedSprintQuery = 'SELECT Sprint FROM SqlScriptMigrations ORDER BY Sprint DESC LIMIT 1';
      const rc = await this.#getRecord(getLastExecutedSprintQuery);
      const lastExecutedSprint = rc ? rc.Sprint : 'Sprint_00';

      const scriptFolder = settings.dbScriptsFolderPath;
      if (fs.existsSync(scriptFolder)) {
        const scriptFolders = fs.readdirSync(scriptFolder).filter((folder) => folder.startsWith('Sprint_') && folder >= lastExecutedSprint).sort();
        for (const sprintFolder of scriptFolders) {
          const sprintFolderPath = path.join(scriptFolder, sprintFolder);
          const sqlFiles = fs.readdirSync(sprintFolderPath).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();
          for (const sqlFile of sqlFiles) {
            const queryCheck = 'SELECT * FROM SqlScriptMigrations WHERE Sprint = ? AND ScriptName = ?';
            const found = await this.#getRecord(queryCheck, [sprintFolder, sqlFile]);
            if (!found) {
              const scriptPath = path.join(sprintFolderPath, sqlFile);
              const sqlScript = fs.readFileSync(scriptPath, 'utf8');
              const sqlStatements = sqlScript.split(';').map((s) => s.split(/\?\
/).map((line) => line.trim().startsWith('--') ? '' : line).join('\
')).filter((s) => s.trim() !== '');
              for (const stmt of sqlStatements) {
                try { await this.#runQuery(stmt); } catch (e) { console.error('[MIGRATION] Error:', e); }
              }
              await this.#runQuery('INSERT INTO SqlScriptMigrations (Sprint, ScriptName, ExecutedTimestamp) VALUES (?, ?, ?)', [sprintFolder, sqlFile, SharedService.getCurrentTimestamp()]);
            }
          }
        }
      }
      this.#db.close();
    }
  }

  static #runQuery(query, params = null) {
    return new Promise((resolve, reject) => {
      this.#db.run(query, params ? params : [], function (err) {
        if (err) return reject(err);
        resolve({ lastId: this.lastID, changes: this.changes });
      });
    });
  }

  static #getRecord(query, filters = []) {
    return new Promise((resolve, reject) => {
      const cb = (err, row) => { if (err) return reject(err); resolve(row); };
      if (filters && filters.length > 0) this.#db.get(query, filters, cb); else this.#db.get(query, cb);
    });
  }
}

module.exports = DBInitializer;
