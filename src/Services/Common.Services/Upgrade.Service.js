const fs = require('fs');
const Tables = require('../../Constants/Tables');
const SharedService = require('./SharedService');
const settings = require('../../settings.json').settings;
const { SqliteDatabase } = require('./dbHandler').default;

class UpgradeService {
  constructor(message) { this.message = message; this.db = new SqliteDatabase(settings.dbPath); }

  async upgradeContract(zipBuffer, payload) {
    const version = payload.version;
    const description = payload.description || '';
    this.db.open();
    try {
      let row = await this.db.getLastRecord(Tables.CONTRACTVERSION);
      const currentVersion = row ? row.Version : 1.0;
      if (!(version > currentVersion)) {
        return { error: { code: 403, message: 'Incoming version must be greater than current version.' } };
      }

      fs.writeFileSync(settings.newContractZipFileName, zipBuffer);

      const postScript = `#!/bin/bash\
\
! command -v unzip &>/dev/null && apt-get update && apt-get install --no-install-recommends -y unzip\
\
zip_file=\"${settings.newContractZipFileName}\"\
\
unzip -o -d ./ \"$zip_file\" >>/dev/null\
\
rm \"$zip_file\" >>/dev/null\
`;
      fs.writeFileSync(settings.postExecutionScriptName, postScript);
      fs.chmodSync(settings.postExecutionScriptName, 0o777);

      const data = { Description: description, LastUpdatedOn: SharedService.context.timestamp, Version: version, CreatedOn: SharedService.context.timestamp };
      const res = await this.db.insertValue(Tables.CONTRACTVERSION, data);
      return { success: { message: 'Contract upgraded', id: res.lastId } };
    } finally { this.db.close(); }
  }
}

module.exports = UpgradeService;
