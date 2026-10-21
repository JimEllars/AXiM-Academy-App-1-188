import React, { useState, useEffect } from 'react';
import { useAcademyStore } from '@/store/useAcademyStore';
import { motion, AnimatePresence } from 'framer-motion';
import SafeIcon from '../../common/SafeIcon';
import { trackAcademyEvent } from '@/lib/utils';

function QuizEngine({ quizData, onComplete, lessonId }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const { saveQuizDraft, getQuizDraft } = useAcademyStore();

  useEffect(() => {
    if (lessonId) {
      const draft = getQuizDraft(lessonId);
      if (draft) {
        setCurrentIndex(draft.currentIndex || 0);
        setSelectedAnswer(draft.selectedAnswer || null);
        setShowResult(draft.showResult || false);
        setHasFailed(draft.hasFailed || false);
      }
    }
  }, [lessonId]);

  useEffect(() => {
    if (lessonId) {
      saveQuizDraft(lessonId, { currentIndex, selectedAnswer, showResult, hasFailed });
    }
  }, [lessonId, currentIndex, selectedAnswer, showResult, hasFailed]);

  
  const currentQuestion = quizData[currentIndex];
  
  const handleSelect = (key) => {
    if (showResult || isSubmitting) return;
    setSelectedAnswer(key);
  };
  
  const handleSubmit = () => {
    if (!selectedAnswer || isSubmitting) return;
    if (selectedAnswer === currentQuestion.correct_answer) {
      setShowResult('correct');
    } else {
      setShowResult('incorrect');
      setHasFailed(true);
    }
  };
  

  const handleNext = async () => {
    if (isSubmitting) return;
    if (showResult === 'correct') {
      if (currentIndex < quizData.length - 1) {
        setCurrentIndex(c => c + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setIsSubmitting(true);
        trackAcademyEvent('QUIZ_COMPLETED', { score: 100, hasFailed });
        await onComplete(100);
        setIsSubmitting(false);
      }
    } else {
      // Retry logic
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-3xl mx-auto shadow-xl">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-white flex items-center space-x-2">
          <SafeIcon name="Cpu" className="h-5 w-5 text-emerald-400" />
          <span>Onyx AI Knowledge Check</span>
        </h3>
        <span className="text-sm font-medium text-gray-400 bg-gray-950 px-3 py-1 rounded-full border border-gray-800">
          Question {currentIndex + 1} of {quizData.length}
        </span>
      </div>
      <div className="mb-8">
        <p className="text-lg text-gray-200 font-medium leading-relaxed">{currentQuestion.question_text}</p>
      </div>
      <div className="space-y-3 mb-8">
        {Object.entries(currentQuestion.options).map(([key, value]) => {
          const isSelected = selectedAnswer === key;
          const isCorrect = key === currentQuestion.correct_answer;
          let stateClass = "bg-gray-950 border-gray-800 hover:border-gray-600 text-gray-300";
          if (isSelected && !showResult) stateClass = "bg-emerald-500/10 border-emerald-500 text-emerald-400";
          if (showResult && isCorrect) stateClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400";
          if (showResult && isSelected && !isCorrect) stateClass = "bg-red-500/10 border-red-500 text-red-400";
          return (
            <button
              key={key}
              onClick={() => handleSelect(key)}
              disabled={showResult !== false || isSubmitting}
              className={`w-full text-left p-4 rounded-xl border transition-all flex items-center space-x-4 ${stateClass}`}
            >
              <div className={`w-8 h-8 rounded border flex items-center justify-center font-bold text-sm ${isSelected ? 'bg-emerald-500/20 border-emerald-500' : 'bg-gray-800 border-gray-700'}`}>
                {key}
              </div>
              <span className="flex-1">{value}</span>
              {showResult && isCorrect && <SafeIcon name="CheckCircle" className="h-5 w-5 text-emerald-500" />}
              {showResult && isSelected && !isCorrect && <SafeIcon name="XCircle" className="h-5 w-5 text-red-500" />}
            </button>
          );
        })}
      </div>
      <AnimatePresence>
        {showResult === 'incorrect' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start space-x-3 text-blue-400"
          >
            <SafeIcon name="Info" className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm leading-relaxed">
              <strong className="block mb-1 text-blue-300">Remediation Hint:</strong>
              {currentQuestion.remediation_hint}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex justify-end">
        {!showResult ? (
          <button onClick={handleSubmit} disabled={!selectedAnswer || isSubmitting} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-medium transition-colors">
            Submit Answer
          </button>
        ) : (
          <button onClick={handleNext} disabled={isSubmitting} className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg border border-gray-700 font-medium transition-colors">
            {isSubmitting ? 'Processing...' : (showResult === 'correct' && currentIndex === quizData.length - 1 ? 'Complete Module' : 'Continue')}
          </button>
        )}
      </div>
    </div>
  );
}
export default QuizEngine;
