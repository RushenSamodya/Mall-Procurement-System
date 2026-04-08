const HotPocket = require('hotpocket-js-client');
const { assertSuccessResponse } = require('../test-utils');

async function poLifecycle() {
  const kp = await HotPocket.generateKeys();
  const client = await HotPocket.createClient(['ws://localhost:8081'], kp);
  if (!await client.connect()) throw new Error('Client connect failed');

  // Create supplier first
  const supCreate = { Service: 'Supplier', Action: 'CreateSupplier', data: { name: 'PO Supplier' } };
  await client.submitContractInput(Buffer.from(JSON.stringify(supCreate)));

  // Fetch suppliers and pick latest
  let list = await client.submitContractReadRequest(Buffer.from(JSON.stringify({ Service: 'Supplier', Action: 'ListSuppliers' })));
  try { list = JSON.parse(list.toString()); } catch (e) { }
  assertSuccessResponse(list, 'List suppliers for PO');
  const suppliers = list.success;
  const supplierId = suppliers && suppliers[0] ? suppliers[0].Id : null;

  const poCreate = { Service: 'PurchaseOrder', Action: 'CreatePO', data: { supplierId: supplierId, notes: 'Test PO' } };
  await client.submitContractInput(Buffer.from(JSON.stringify(poCreate)));

  let pos = await client.submitContractReadRequest(Buffer.from(JSON.stringify({ Service: 'PurchaseOrder', Action: 'ListPOs' })));
  try { pos = JSON.parse(pos.toString()); } catch (e) { }
  assertSuccessResponse(pos, 'List POs');

  return true;
}

module.exports = { poLifecycle };
