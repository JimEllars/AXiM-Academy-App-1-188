import { useEffect } from 'react';
import { captureAffiliateRef } from '../lib/affiliate';

/**
 * Capture `?ref=` on any landing page, not just the catalog.
 *
 * A partner can deep-link to a course page, so this runs once at the app shell
 * rather than inside the storefront. The id sits in sessionStorage until
 * checkout attaches it to the enrollment.
 */
export function useAffiliateCapture(search) {
  useEffect(() => {
    if (!search) return;
    captureAffiliateRef(search);
  }, [search]);
}
