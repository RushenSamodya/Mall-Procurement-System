function success(data) {
  return { success: data };
}
function error(code, message, details) {
  return { error: { code: code || 500, message: message || 'Error', details: details || null } };
}
module.exports = { success, error };
