const { supplierLifecycle } = require('./TestCases/SupplierTest');
const { poLifecycle } = require('./TestCases/PurchaseOrderTest');

(async () => {
  try {
    console.log('Running Supplier lifecycle test...');
    await supplierLifecycle();
    console.log('Supplier lifecycle test completed.');

    console.log('Running Purchase Order lifecycle test...');
    await poLifecycle();
    console.log('Purchase Order lifecycle test completed.');

    console.log('All tests passed.');
    process.exit(0);
  } catch (e) {
    console.error('Tests failed:', e);
    process.exit(2);
  }
})();
