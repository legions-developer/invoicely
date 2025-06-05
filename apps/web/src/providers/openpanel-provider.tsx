"use client";

import { OpenPanelComponent } from "@openpanel/nextjs";
import { useMounted } from "@mantine/hooks";

export const OpenPanelProvider = () => {
  const isMounted = useMounted();

  if (!isMounted) {
    return null;
  }

  return (
    <OpenPanelComponent
      clientId="97f47a54-d163-482d-b163-06291921523f"
      trackScreenViews={true}
      trackAttributes={true}
      trackOutgoingLinks={true}
      trackHashChanges={true}
    />
  );
};
