import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: { enabled: true, runs: 200 }
    }
  },
  paths: {
    sources: "./src",
    artifacts: "./artifacts"
  },
  // Workaround HH1006 by excluding node_modules from sources via ignored paths
  mocha: {},
  // Hardhat uses glob patterns internally; ensure it only compiles our files
  // Alternative: move contracts to ./contracts and set sources accordingly
};

export default config;


