function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error(`Assertion failed: ${msg} | expected=${expected}, actual=${actual}`);
}
function assertSuccessResponse(res, msg) {
  if (!res || !res.success) throw new Error(`Expected success response: ${msg}`);
}
function assertErrorResponse(res, code, msg) {
  if (!res || !res.error) throw new Error(`Expected error response: ${msg}`);
  if (code != null && res.error.code !== code) throw new Error(`Expected error code ${code} but got ${res.error.code}`);
}
module.exports = { assertEqual, assertSuccessResponse, assertErrorResponse };
