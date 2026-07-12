import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function trackAcademyEvent(eventName, payload = {}) {
  try {
    const timestamp = new Date().toISOString();

    // Attempt to gather context safely
    let walletAddress = null;
    let userId = null;

    // We can extract from store state dynamically or let the caller pass it
    // Usually a good pattern is to try getting the Zustand store state without hook rules
    // But since this is a pure function, we rely on the payload or window object

    // If not in payload, fallback to empty string
    const eventPayload = {
      event: eventName,
      timestamp,
      wallet_address: payload.walletAddress || null,
      user_id: payload.userId || null,
      ip_context: 'captured_by_edge', // Asguard WAF will enrich this at the edge
      data: payload,
    };

    // Dispatch to Asguard WAF edge interceptors
    // We simulate a network dispatch for the telemetry pipeline
    // In a real app this might use fetch to a specific endpoint
    // We use sendBeacon or fetch

    console.log(`[TELEMETRY DISPATCH]: ${eventName}`, eventPayload);

    // We wrap it in a mock async function to simulate silent network request
    // This connects to the Asguard WAF logic requested in Task 1
    fetch('/_telemetry/asguard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventPayload),
      // Keepalive ensures the request isn't cancelled if the user navigates away
      keepalive: true
    }).catch(err => {
      // Silently fail telemetry errors to not disrupt user experience
      console.warn('Telemetry dispatch suppressed:', err.message);
    });

  } catch (error) {
    console.error('Failed to track academy event:', error);
  }
}
