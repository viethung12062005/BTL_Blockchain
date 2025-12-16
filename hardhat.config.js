require("dotenv").config(); // Đọc file .env
require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy");

// Lấy biến từ .env
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL || "";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200, // Tối ưu gas
          },
        },
      },
    ],
  },
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  paths: {
    sources: "./src/contracts", // Đường dẫn tới file .sol
    tests: "./test",
    cache: "./cache",
    artifacts: "./src/artifacts", // Nơi lưu ABI sau khi compile
  },
};