"use client";

import { trpc } from "@/trpc/client";
import React from "react";

const Page = () => {
  const helloResult = trpc.hello.hello.useQuery({
    text: "Gurbinder",
  });

  console.log("helloResult", helloResult.data);

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Data:</h2>
        <div>
          {helloResult.isLoading
            ? "Loading..."
            : helloResult.data && typeof helloResult.data === "object" && "greeting" in helloResult.data
              ? helloResult.data.greeting
              : String(helloResult.data)}
        </div>
      </div>

      <div className="mb-4">
        <h2 className="text-xl font-bold">Cache Status:</h2>
        <ul className="list-disc pl-5">
          <li>isFetching: {helloResult.isFetching.toString()} (true if request is in progress)</li>
          <li>isFetched: {helloResult.isFetched.toString()} (true if data was fetched at least once)</li>
          <li>isRefetching: {helloResult.isRefetching.toString()} (true if refetching cached data)</li>
          <li>isStale: {helloResult.isStale.toString()} (true if data is stale and needs refetching)</li>
          <li>
            dataUpdatedAt:{" "}
            {helloResult.dataUpdatedAt ? new Date(helloResult.dataUpdatedAt).toLocaleTimeString() : "N/A"}
          </li>
        </ul>
      </div>

      <button className="rounded bg-blue-500 px-4 py-2 text-white" onClick={() => helloResult.refetch()}>
        Refetch Data
      </button>
    </div>
  );
};

export default Page;
