const fs = require('fs');
// commit to test git 1
function parseEnv() {
  const envPath = '.env';
  const env = {};
  if (!fs.existsSync(envPath)) return env;
  const res = fs.readFileSync(envPath, 'utf8');
  res.split(/\
?\
/).forEach((line) => {
    if (!line || line.trim().startsWith('#')) return;
    const idx = line.indexOf('=');
    if (idx === -1) return;
    const key = line.slice(0, idx);
    const valRaw = line.slice(idx + 1);
    let val = valRaw;
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  });
  return env;
}

module.exports = parseEnv();
