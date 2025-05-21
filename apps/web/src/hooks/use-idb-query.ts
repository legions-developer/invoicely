import { asyncTryCatch } from "@/lib/neverthrow/tryCatch";
import { useState, useEffect } from "react";

type UseIDBQueryResult<T> = {
  data: T | never[];
  error: Error | null;
  isLoading: boolean;
};

export function useIDBQuery<T>(queryFn: () => Promise<T>): UseIDBQueryResult<T> {
  const [data, setData] = useState<T | never[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);

      const { success, data, error } = await asyncTryCatch(queryFn(), {
        errorMessage: "[USE-IDB-QUERY ERROR]: An error occurred while fetching data",
      });

      if (success) {
        setData(data);
        setIsLoading(false);
      } else {
        setError(error);
        setData([]);
        setIsLoading(false);
      }
    };

    fetchData();
  }, [queryFn]);

  return { data, error, isLoading };
}
