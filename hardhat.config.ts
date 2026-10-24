import "@nomicfoundation/hardhat-toolbox";
import { config as dotenvConfig } from "dotenv";
import type { HardhatUserConfig } from "hardhat/config";

dotenvConfig({ path: ".env" });

const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL || process.env.NEXT_PUBLIC_CHAIN_RPC_URL || "";
const polygonAmoyRpcUrl = process.env.POLYGON_AMOY_RPC_URL || "";
const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      type: "http",
      url: sepoliaRpcUrl,
      accounts: adminPrivateKey ? [adminPrivateKey] : [],
    },
    amoy: {
      type: "http",
      url: polygonAmoyRpcUrl,
      accounts: adminPrivateKey ? [adminPrivateKey] : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
