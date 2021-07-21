import * as utils from '@/vaults/utils';

describe('utils', () => {
  test('vaultIds are alphanumeric', async () => {
    const id1 = await utils.generateVaultId();

    expect(isAlphaNumeric(id1)).toBe(true);
  });
});

function isAlphaNumeric(str) {
  let code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (
      !(code > 47 && code < 58) && // numeric (0-9)
      !(code > 64 && code < 91) && // upper alpha (A-Z)
      !(code > 96 && code < 123)
    ) {
      // lower alpha (a-z)
      return false;
    }
  }
  return true;
}
