// Các hằng số cho Privado ID (Polygon ID)

// URL của Node Issuer (Dùng bản demo hoặc self-hosted)
export const ISSUER_API_URL = "https://issuer-admin.polygonid.me/v1"; 

// Schema ID cho cử tri (Ví dụ: Voter Credential)
// Bạn có thể tạo Schema riêng trên Polygon ID Platform. Đây là ví dụ mẫu.
export const VOTER_SCHEMA_ID = "36f4d8a9-4567-8901-2345-678901234567"; 
export const VOTER_SCHEMA_URL = "https://s3.eu-west-1.amazonaws.com/polygonid-schemas/voter-credential.json";
export const VOTER_SCHEMA_TYPE = "VoterCredential";

// Thông tin Circuit xác thực (Sig - Signature)
// Circuit Id: credentialAtomicQuerySigV2 (Xác thực chữ ký off-chain nhanh, rẻ gas)
export const CIRCUIT_ID = "credentialAtomicQuerySigV2";

// Địa chỉ Contract Verifier của Privado ID trên mạng Sepolia
// Đây là Universal Verifier có sẵn của họ
export const PRIVADO_VALIDATOR_CONTRACT_ADDRESS = "0xF51547e4088761697450963918D6574c2e9e3762"; 

// Request ID cho việc xác thực (để phân biệt các request)
export const AUTH_REQUEST_ID = "7f38a193-0918-4a48-9fac-36fdb22b281c";

// Public Key Hash cũ (của hệ thống cũ) - Giữ lại nếu cần tham chiếu
export const productionPublicKeyHash = '15100764808137121660160871414130376377652473835020058565951744372715764457760';
export const endpointUrl = process.env.REACT_APP_ENDPOINT_URL || "http://192.168.56.1:8000/vkey.json";