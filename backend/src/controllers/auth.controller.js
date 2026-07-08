const authService = require('../services/auth.service');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/ApiResponse');

const register = catchAsync(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.register({
    name,
    email,
    phone,
    password,
  });

  return new ApiResponse(
    201,
    { user, accessToken, refreshToken },
    'Account created successfully',
  ).send(res);
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await authService.login({ email, password });

  return new ApiResponse(200, { user, accessToken, refreshToken }, 'Login successful').send(res);
});

const refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refresh(refreshToken);

  return new ApiResponse(
    200,
    { user: result.user, accessToken: result.accessToken, refreshToken: result.refreshToken },
    'Token refreshed successfully',
  ).send(res);
});

const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);

  return new ApiResponse(200, null, 'Logged out successfully').send(res);
});

const forgotPassword = catchAsync(async (req, res) => {
  const { rawToken } = await authService.forgotPassword(req.body.email);

  return new ApiResponse(
    200,
    { resetToken: rawToken },
    'If an account exists for this email, a password reset link has been sent',
  ).send(res);
});

const resetPassword = catchAsync(async (req, res) => {
  const { token, password } = req.body;
  await authService.resetPassword(token, password);

  return new ApiResponse(200, null, 'Password reset successfully').send(res);
});

module.exports = { register, login, refresh, logout, forgotPassword, resetPassword };
