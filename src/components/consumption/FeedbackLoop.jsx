import React from 'react';
import { Feedback } from '@questlabs/react-sdk';
import { useAcademyStore } from '../../store/useAcademyStore';
import { sdkTheme } from '../../theme/sdkTheme';

export default function FeedbackLoop({ courseId, onComplete }) {
  const { user } = useAcademyStore();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-[2.5rem] p-8 shadow-2xl max-w-2xl mx-auto">
      <Feedback
        questId={`feedback-${courseId}`}
        userId={user?.id || 'anon'}
        token={import.meta.env.VITE_QUEST_TOKEN}
        styleConfig={sdkTheme}
        onComplete={onComplete}
      />
    </div>
  );
}