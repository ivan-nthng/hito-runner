import { useEffect, useRef, useState } from "react";

export function useGeneratedPlanReadyTransition({
  hasReviewedDraft,
  initialLoading,
  open,
}: {
  hasReviewedDraft: boolean;
  initialLoading: boolean;
  open: boolean;
}) {
  const wasWaitingRef = useRef(false);
  const [showCompletion, setShowCompletion] = useState(false);

  useEffect(() => {
    if (!open) {
      wasWaitingRef.current = false;
      setShowCompletion(false);
      return;
    }

    if (initialLoading) {
      wasWaitingRef.current = true;
      setShowCompletion(false);
      return;
    }

    if (!wasWaitingRef.current || !hasReviewedDraft) {
      return;
    }

    wasWaitingRef.current = false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShowCompletion(false);
      return;
    }

    setShowCompletion(true);
    const completionTimer = window.setTimeout(() => {
      setShowCompletion(false);
    }, 520);

    return () => {
      window.clearTimeout(completionTimer);
    };
  }, [hasReviewedDraft, initialLoading, open]);

  return showCompletion;
}
