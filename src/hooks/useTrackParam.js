import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAcademyStore } from '../store/useAcademyStore';
import { ALL_TRACKS, readTrackParam } from '../lib/track';

/**
 * Keeps the storefront filter in sync with the URL.
 *
 * `/?category=creative-labs` and `/?track=professional-edge` both land on the
 * same filter, and navigating to plain `/` clears it. Without the clear, the
 * filter survived a trip to a course page and back, so the catalog came up
 * pre-filtered with no visible reason.
 *
 * One writer (the page that owns the catalog), many readers (CourseGrid).
 */
export function useTrackParam() {
  const [searchParams] = useSearchParams();
  const setActiveCategory = useAcademyStore((state) => state.setActiveCategory);

  const hasTrackParam = searchParams.has('category') || searchParams.has('track');
  const activeTrack = hasTrackParam ? readTrackParam(searchParams, ALL_TRACKS) : ALL_TRACKS;

  useEffect(() => {
    setActiveCategory(activeTrack);
  }, [activeTrack, setActiveCategory]);

  return { activeTrack, hasTrackParam };
}
