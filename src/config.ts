import { http, createConfig } from "wagmi";
import { sepolia } from "wagmi/chains"; // Import Sepolia có sẵn
import { walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID || "YOUR_WALLETCONNECT_PROJECT_ID";

const metadata = {
  name: "ZK Voto Digital",
  description: "Example voting app",
  url: "http://localhost:3000/",
  icons: ["https://avatars.githubusercontent.com/u/37784886"],
};

export const wagmiConfig = createConfig({
  chains: [sepolia], // Sử dụng mạng Sepolia
  connectors: [
    walletConnect({
      projectId,
      metadata,
    }),
  ],
  transports: {
    [sepolia.id]: http(),
  },
});