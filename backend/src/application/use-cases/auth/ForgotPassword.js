class ForgotPassword {
  constructor({ userRepository, resetTokenRepository, tokenService, emailService, clientUrl }) {
    this.userRepository = userRepository;
    this.resetTokenRepository = resetTokenRepository;
    this.tokenService = tokenService;
    this.emailService = emailService;
    this.clientUrl = clientUrl;
  }

  async execute({ email }) {
    const user = await this.userRepository.findByEmail(email?.trim().toLowerCase());
    if (!user || user.status !== 'active') return;

    await this.resetTokenRepository.invalidateForUser(user.id);
    const token = this.tokenService.generateOpaqueToken();
    await this.resetTokenRepository.create({
      userId: user.id,
      tokenHash: this.tokenService.hashToken(token),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
    const resetUrl = `${this.clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
    console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
    await this.emailService.sendPasswordReset({
      email: user.email,
      fullName: user.fullName,
      resetUrl,
    });
  }
}

module.exports = ForgotPassword;

