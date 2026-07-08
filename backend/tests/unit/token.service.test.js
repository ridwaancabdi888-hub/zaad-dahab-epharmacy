const mongoose = require('mongoose');
const tokenService = require('../../src/services/token.service');

function buildUser() {
  return { _id: new mongoose.Types.ObjectId(), role: 'customer' };
}

describe('token.service', () => {
  it('signs an access token that embeds the user id and role', () => {
    const user = buildUser();
    const token = tokenService.signAccessToken(user);

    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('issues a refresh token and persists a hashed record for it', async () => {
    const user = buildUser();
    const refreshToken = await tokenService.issueRefreshToken(user);

    const RefreshToken = require('../../src/models/RefreshToken');
    const record = await RefreshToken.findOne({ tokenHash: tokenService.hashToken(refreshToken) });

    expect(record).not.toBeNull();
    expect(record.user.toString()).toBe(user._id.toString());
    expect(record.isActive()).toBe(true);
  });

  it('rotates a valid refresh token exactly once', async () => {
    const user = buildUser();
    const refreshToken = await tokenService.issueRefreshToken(user);

    const firstRotation = await tokenService.rotateRefreshToken(refreshToken);
    expect(firstRotation).toBe(user._id.toString());

    const secondRotation = await tokenService.rotateRefreshToken(refreshToken);
    expect(secondRotation).toBeNull();
  });

  it('returns null when rotating a malformed token', async () => {
    const result = await tokenService.rotateRefreshToken('garbage.token.value');
    expect(result).toBeNull();
  });
});
