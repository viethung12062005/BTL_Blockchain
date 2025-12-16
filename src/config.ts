export const CONFIG = {
  // Thay đổi URL này thành URL Ngrok hoặc Domain thật của bạn khi deploy
  // Ví dụ: "https://my-dapp.ngrok-free.app"
  // KHÔNG ĐƯỢC ĐỂ LÀ LOCALHOST KHI TEST VỚI VÍ TRÊN ĐIỆN THOẠI
  PUBLIC_URL: process.env.REACT_APP_PUBLIC_URL || "https://your-public-server-url.com",
  
  // Polygon ID Configuration
  VERIFIER_DID: "did:polygonid:polygon:mumbai:2q...", // DID của Verifier (DApp của bạn)
  SCHEMA_TYPE: "VotingCredential", // Tên schema bạn đã tạo trên Polygon ID Platform
  SCHEMA_URL: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld", // Link tới file json-ld schema
};

export const ROUTES = {
  HOME: "/",
  VOTE: "/vote",
  ADMIN: "/admin",
  RESULTS: "/results",
};