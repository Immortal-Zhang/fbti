"use client";
import { useSyncExternalStore } from "react";
import { decodeHash } from "./snapshot";
import { normalizeAppPath } from "@/lib/paths";

function subscribe(listener: () => void) {
  window.addEventListener("hashchange", listener);
  window.addEventListener("popstate", listener);
  return () => {
    window.removeEventListener("hashchange", listener);
    window.removeEventListener("popstate", listener);
  };
}
const getLocation = () =>
  `${normalizeAppPath(window.location.pathname) ?? window.location.pathname}${window.location.hash}`;
const getOrigin = () => window.location.origin;
const server = () => null;
export function usePacket(expectedPath: "/s" | "/friends" | "/compare") {
  const location = useSyncExternalStore(subscribe, getLocation, server);
  if (location === null || location.split("#")[0] !== expectedPath)
    return { ready: false, packet: null };
  try {
    return {
      ready: true,
      packet: decodeHash(location.slice(expectedPath.length)),
    };
  } catch {
    return { ready: true, packet: null };
  }
}
export function useBrowserOrigin() {
  return useSyncExternalStore(subscribe, getOrigin, server);
}
