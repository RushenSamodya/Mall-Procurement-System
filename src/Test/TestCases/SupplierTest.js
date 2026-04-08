const HotPocket = require('hotpocket-js-client');
const { assertSuccessResponse } = require('../test-utils');

async function supplierLifecycle() {
  const kp = await HotPocket.generateKeys();
  const client = await HotPocket.createClient(['ws://localhost:8081'], kp);
  if (!await client.connect()) throw new Error('Client connect failed');

  // Create supplier
  let res = await client.submitContractReadRequest(Buffer.from(JSON.stringify({ Service: 'Supplier', Action: 'ListSuppliers' })));
  try { res = JSON.parse(res.toString()); } catch (e) { }

  const createPayload = { Service: 'Supplier', Action: 'CreateSupplier', data: { name: 'Acme Corp', email: 'acme@example.com', phone: '12345', address: '1 Main St' } };
  await client.submitContractInput(Buffer.from(JSON.stringify(createPayload)));

  // No immediate output is guaranteed; query list to find it
  let list = await client.submitContractReadRequest(Buffer.from(JSON.stringify({ Service: 'Supplier', Action: 'ListSuppliers' })));
  try { list = JSON.parse(list.toString()); } catch (e) { }
  assertSuccessResponse(list, 'List suppliers');

  return true;
}

module.exports = { supplierLifecycle };
