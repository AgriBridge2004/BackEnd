import { completeOnboarding } from './users.service.js';

export const completeOnboardingController = async (req, res) => {
  try {
    const userId = req.user.id; // بجيب من الـ JWT Token

    const user = await completeOnboarding(userId);

    return res.status(200).json({
      message: 'Onboarding completed successfully',
      hasCompletedOnboarding: user.hasCompletedOnboarding,
    });

  } catch (error) {
    console.error('ONBOARDING ERROR:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};