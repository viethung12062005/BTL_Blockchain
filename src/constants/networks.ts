/**
 * Network Configuration Constants
 * Updated for Sepolia Testnet
 */

// Sepolia Configuration
export const SEPOLIA_CONFIG = {
  chainId: '0xaa36a7', // 11155111 in hex
  chainName: 'Sepolia',
  nativeCurrency: {
    name: 'Sepolia Ether',
    symbol: 'SEP',
    decimals: 18
  },
  // Dùng RPC công cộng hoặc thay bằng API Key của bạn từ Alchemy/Infura để nhanh hơn
  // Replace <YOUR_INFURA_PROJECT_ID> with your Infura project ID, e.g.
  // 'https://sepolia.infura.io/v3/abcd1234...'
  rpcUrls: ['https://sepolia.infura.io/v3/197e16519a134177bf189531ab66b585'], 
  blockExplorerUrls: ['https://sepolia.etherscan.io']
};

// Primary chain ID for the application
export const BLOCKDAG_CHAIN_ID = SEPOLIA_CONFIG.chainId; // Giữ tên biến cũ để tránh sửa nhiều file, nhưng gán giá trị Sepolia

// Chain ID in decimal format for comparisons
export const BLOCKDAG_CHAIN_ID_DECIMAL = 11155111;

// Network display name
export const NETWORK_NAME = 'Sepolia';

// Block explorer URL for transactions
export const BLOCK_EXPLORER_URL = 'https://sepolia.etherscan.io';

// RPC URL for direct provider connections
// Update this to include your Infura project id, or put the full URL in `.env`
export const RPC_URL = 'https://sepolia.infura.io/v3/197e16519a134177bf189531ab66b585';

/**
 * Gets the complete network configuration for wallet_addEthereumChain
 */
export const getNetworkConfig = () => SEPOLIA_CONFIG;

/**
 * Formats a transaction hash for block explorer viewing
 */
export const getTransactionUrl = (txHash: string): string => {
  return `${BLOCK_EXPLORER_URL}/tx/${txHash}`;
};

/**
 * Formats an address for block explorer viewing
 */
export const getAddressUrl = (address: string): string => {
  return `${BLOCK_EXPLORER_URL}/address/${address}`;
};