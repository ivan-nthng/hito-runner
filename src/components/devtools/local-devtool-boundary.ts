import { useEffect, useState } from "react";

const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function canLoadLocalDevtool(hostname?: string) {
  if (typeof window === "undefined" && hostname == null) return false;

  const host = (hostname ?? window.location.hostname).toLowerCase();
  return LOOPBACK_HOSTNAMES.has(host) || /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

export function useLocalDevtoolBoundary() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    setAvailable(canLoadLocalDevtool());
  }, []);

  return available;
}
