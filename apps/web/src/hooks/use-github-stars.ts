/**
 * This hook is used to fetch the number of stars for a given repository from GitHub.
 * Created by: @legions-developer
 * For: @invoicely
 */

import { useState, useEffect } from "react";

interface GithubStarsResponse {
  stargazers_count: number;
}

export function useGithubStars() {
  const [stars, setStars] = useState<number>(0);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStars = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`https://api.github.com/repos/legions-developer/invoicely`, {
          next: {
            revalidate: 60 * 60, // 1 Hour
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch GitHub stars");
        }

        const data: GithubStarsResponse = await response.json();
        setStars(data.stargazers_count);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("An error occurred"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchStars();
  }, []);

  return { stars, error, isLoading };
}
