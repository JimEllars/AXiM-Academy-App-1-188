import React from 'react';
import { trackAcademyEvent } from '../lib/utils';
import SafeIcon from './SafeIcon';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    trackAcademyEvent('SYSTEM_ERROR', { error: error.message, componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-gray-950 text-center">
          <div className="bg-gray-900 rounded-full p-6 mb-6 shadow-xl border border-gray-800">
            <SafeIcon name="AlertTriangle" className="h-12 w-12 text-yellow-500" />
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">Module Recalibration</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            This module is currently being recalibrated by AXiM Core. Please try again later.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-8 bg-gray-800 text-white px-6 py-3 rounded-xl font-bold border border-gray-700 hover:bg-gray-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
