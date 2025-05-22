import { usePostHog } from "posthog-js/react";
import { IAnalytics } from "@/types";
import * as React from "react";

interface PostHogAnalyticsProps extends React.HTMLAttributes<HTMLDivElement> {
  analytics?: IAnalytics;
  as?: React.ElementType;
}

function PostHogAnalytics({ className, analytics, onClick, as: Component = "div", ...props }: PostHogAnalyticsProps) {
  const posthog = usePostHog();

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      // Track analytics event if analytics name is provided and posthog is available
      if (analytics?.name && posthog) {
        try {
          posthog.capture(analytics.name, {
            elementGroup: analytics.group,
          });
        } catch (error) {
          console.warn('Failed to capture analytics event:', error);
        }
      }

      // Call the original onClick handler if provided
      onClick?.(event);
    },
    [analytics, onClick, posthog],
  );

  return <Component className={className} onClick={handleClick} {...props} />;
}

export { PostHogAnalytics };
