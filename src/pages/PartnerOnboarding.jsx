import React from 'react';
import { OnBoarding } from '@questlabs/react-sdk';
import { useNavigate } from 'react-router-dom';
import { useAcademyStore } from '../store/useAcademyStore';
import { sdkTheme } from '../theme/sdkTheme';

export default function PartnerOnboarding() {
  const navigate = useNavigate();
  const { user } = useAcademyStore();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <OnBoarding
          questId="partner-onboarding-protocol"
          userId={user?.id || 'anon'}
          token={import.meta.env.VITE_QUEST_TOKEN}
          styleConfig={sdkTheme}
          onComplete={() => navigate('/teacher')}
        />
      </div>
    </div>
  );
}