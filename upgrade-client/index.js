const fs = require('fs');
const path = require('path');
const nacl = require('tweetnacl');
const ContractService = require('./contract-service');

// Usage:
// node index.js <wsContractUrl> <zipFilePath> <privateKeyHex> <version> <description>

const contractUrl = process.argv[2];
const zipPath = process.argv[3];
const privateKeyHex = process.argv[4];
const version = process.argv[5];
const description = process.argv[6] || '';

if (!contractUrl || !zipPath || !privateKeyHex || !version) {
  console.error('Usage: node index.js <wsContractUrl> <zipFilePath> <privateKeyHex> <version> <description>');
  process.exit(1);
}

(async () => {
  try {
    const contractService = new ContractService([contractUrl]);
    const ok = await contractService.init();
    if (!ok) throw new Error('Failed to init client');

    const fileName = path.basename(zipPath);
    const fileContent = fs.readFileSync(zipPath);
    const sizeKB = Math.round(fileContent.length / 1024);

    const sk = Buffer.from(privateKeyHex, 'hex');
    if (sk.length !== 64) {
      console.error('Private key must be 64 bytes (128 hex chars) for Ed25519.');
      process.exit(1);
    }
    const sig = nacl.sign.detached(new Uint8Array(fileContent), new Uint8Array(sk));

    const request = {
      Service: 'Upgrade',
      Action: 'UpgradeContract',
      data: {
        version: parseFloat(version),
        description: description,
        zipBase64: fileContent.toString('base64'),
        zipSignatureHex: Buffer.from(sig).toString('hex')
      }
    };

    console.log(`Uploading ${fileName} (${sizeKB}KB)...`);
    const res = await contractService.submitInputToContract(request);
    console.log('Upgrade submission response:', res);
    process.exit(0);
  } catch (e) {
    console.error('Upgrade failed:', e);
    process.exit(2);
  }
})();
