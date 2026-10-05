"use client";

import { createStore, Provider } from "jotai";

const store = createStore();

export const JotaiProvider = ({ children }: { children: React.ReactNode }) => {
  return <Provider store={store}>{children}</Provider>;
};
