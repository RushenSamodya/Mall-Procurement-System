const nacl = require('tweetnacl');
const env = require('../Utils/Environment');
const UpgradeService = require('../Services/Common.Services/Upgrade.Service');

function hexToUint8(hex) { return new Uint8Array(Buffer.from(hex, 'hex')); }
function isMaintainer(userPubKeyHex) {
  const expected = (env.MAINTAINER_PUBKEY || '').toLowerCase();
  if (!expected || expected.length === 0) return false;
  return (userPubKeyHex || '').toLowerCase() === expected;
}

class UpgradeController {
  constructor(message) { this.message = message; this.service = new UpgradeService(message); }

  async handleRequest(user) {
    try {
      switch (this.message.Action) {
        case 'UpgradeContract':
          const userKey = (user.publicKey || user.pubKey || '').toString().toLowerCase();
          if (!isMaintainer(userKey)) {
            return { error: { code: 401, message: 'Unauthorized' } };
          }
          const payload = this.message.data || {};
          if (!payload.zipBase64 || !payload.zipSignatureHex || !payload.version) {
            return { error: { code: 400, message: 'Missing upgrade data' } };
          }
          const zipBuffer = Buffer.from(payload.zipBase64, 'base64');
          const sig = hexToUint8(payload.zipSignatureHex);
          const pub = hexToUint8((env.MAINTAINER_PUBKEY || ''));
          const verified = nacl.sign.detached.verify(new Uint8Array(zipBuffer), sig, pub);
          if (!verified) return { error: { code: 401, message: 'Signature verification failed' } };
          return await this.service.upgradeContract(zipBuffer, payload);
        default:
          return { error: { code: 400, message: 'Invalid action' } };
      }
    } catch (e) {
      return { error: { code: 500, message: 'Upgrade failed', details: e?.message || e } };
    }
  }
}

module.exports = UpgradeController;
