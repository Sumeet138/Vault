import { useEffect, useState } from "react";

export const useIsMounted = () => {
  const [is, setIs] = useState(false);

  useEffect(() => {
    setIs(true);
  }, []);

  return is;
};
