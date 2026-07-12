
import { darkTheme } from '@thirdweb-dev/react';

export const sdkTheme = {
  Form: {
    backgroundColor: '#0a0a0a',
    border: '1px solid #1f2937',
    borderRadius: '1.5rem',
    padding: '24px'
  },
  Topbar: {
    borderBottom: '1px solid #1f2937'
  },
  Heading: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '800'
  },
  Description: {
    color: '#9ca3af',
    fontSize: '14px'
  },
  PrimaryButton: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderRadius: '0.75rem',
    fontWeight: '700'
  },
  Input: {
    backgroundColor: '#030712',
    color: '#ffffff',
    border: '1px solid #1f2937',
    borderRadius: '0.75rem'
  },
  Card: {
    backgroundColor: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '1rem'
  },
  ProgressBar: {
    barColor: '#10b981',
    barParentColor: '#1f2937',
    ProgressText: {
      color: '#ffffff',
      fontSize: '12px',
      fontWeight: '700'
    }
  },
  listHover: {
    background: '#1f2937',
    iconBackground: '#10b981',
    iconColor: '#ffffff',
    Heading: '#ffffff',
    Description: '#9ca3af',
    Icon: { color: '#9ca3af' },
    defaultIconBackground: '#0a0a0a'
  },
  SingleChoice: {
    style: { backgroundColor: '#111827', border: '1px solid #1f2937', color: '#ffffff' },
    selectedStyle: { backgroundColor: '#10b981', color: '#ffffff', border: '1px solid #10b981' },
    hoverBackground: '#1f2937'
  }
};

export const thirdwebTheme = darkTheme({
  colors: {
    modalBg: '#0a0a0a',
    primaryButtonBg: '#10b981',
    primaryButtonText: '#ffffff',
    secondaryButtonBg: '#1f2937',
    secondaryButtonText: '#ffffff',
    secondaryButtonHoverBg: '#374151',
    borderColor: '#1f2937',
    separatorLine: '#1f2937',
    primaryText: '#ffffff',
    secondaryText: '#9ca3af',
    connectedButtonBgHover: '#10b981',
    connectedButtonBg: '#0a0a0a',
  },
});
