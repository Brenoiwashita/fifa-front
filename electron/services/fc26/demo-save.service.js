const path = require('path');
function getDemoSavePath() {
  return path.join(__dirname, '..', '..', '..', 'fixtures', 'CmMgr_TEST_MAC');
}
module.exports = { getDemoSavePath };
