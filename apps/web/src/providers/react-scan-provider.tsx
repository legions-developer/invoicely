"use client";

import { scan } from "react-scan";

if (typeof window !== "undefined") {
  scan({
    enabled: false,
  });
}

export const ReactScanProvider = () => {
  return null;
};
