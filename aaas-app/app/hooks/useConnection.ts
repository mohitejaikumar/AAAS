import { Connection, clusterApiUrl } from "@solana/web3.js";

export function useConnection() {
  const connection = new Connection(clusterApiUrl("devnet"));
  return connection;
}
