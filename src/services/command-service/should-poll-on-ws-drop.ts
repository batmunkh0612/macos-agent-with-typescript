/* eslint-disable complexity -- single guard mirrors three explicit ifs */
export const shouldPollOnWsDrop = (running: boolean, wasConnected: boolean, connected: boolean): boolean =>
  running && wasConnected && !connected;
