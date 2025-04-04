import { Connection, clusterApiUrl } from "@solana/web3.js";

export function useConnection() {
  const connection = new Connection(
    "https://devnet.helius-rpc.com/?api-key=504f0aca-9f19-4e4d-ae17-467d2e3e3840"
  );
  return connection;
}
