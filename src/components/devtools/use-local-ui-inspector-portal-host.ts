import { useEffect, useState } from "react";

export function useLocalUiInspectorPortalHost() {
  const [host, setHost] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHost(document.body);
  }, []);

  return host;
}
