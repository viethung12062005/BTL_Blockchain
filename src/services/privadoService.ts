import { 
    CIRCUIT_ID, 
    VOTER_SCHEMA_ID, 
    VOTER_SCHEMA_TYPE, 
    VOTER_SCHEMA_URL,
    AUTH_REQUEST_ID 
} from '../constants';

export class PrivadoService {

    /**
     * Tạo yêu cầu xác thực (Auth Request) để hiển thị QR Code
     * @param contractAddress Địa chỉ contract bầu cử (người nhận proof)
     * @param chainId Chain ID của mạng (Sepolia = 11155111)
     */
    static createVotingRequest(contractAddress: string, chainId: number) {
        // Cấu trúc chuẩn của Iden3 Authorization Request
        const request = {
            id: AUTH_REQUEST_ID,
            thid: AUTH_REQUEST_ID,
            from: "did:polygon:sepolia:2q...", // DID của dApp (có thể tạo thật hoặc để placeholder)
            typ: "application/iden3comm-plain-json",
            type: "https://iden3-communication.io/authorization/1.0/request",
            body: {
                reason: "Xác thực cử tri hợp lệ để bỏ phiếu",
                message: "",
                callbackUrl: "", // Để trống nếu không dùng server relay (client-side flow)
                scope: [
                    {
                        id: 1,
                        circuitId: CIRCUIT_ID,
                        query: {
                            allowedIssuers: ["*"], // Chấp nhận credential từ mọi issuer (hoặc chỉ định cụ thể)
                            context: "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld", // Context chuẩn (ví dụ KYC)
                            type: "KYCAgeCredential", // Loại credential yêu cầu (ví dụ chứng minh tuổi)
                            credentialSubject: {
                                birthday: {
                                    $lt: 20050101 // Yêu cầu sinh trước năm 2005 (> 18 tuổi)
                                }
                            }
                        }
                    }
                ],
                // Thông tin giao dịch để ví biết cần tương tác với contract nào
                transaction_data: {
                    contract_address: contractAddress,
                    method_id: "0x...", // Function selector của voteForProposal (tùy chọn)
                    chain_id: chainId,
                    network: "sepolia"
                }
            }
        };

        return request;
    }

    /**
     * Hàm parse bằng chứng JSON từ ví Privado ID
     * Dùng khi người dùng copy proof từ ví và paste vào web (Client-side flow)
     */
    static parseProof(proofString: string) {
        try {
            const proofJson = JSON.parse(proofString);
            
            // Trong thực tế cần thư viện @iden3/js-iden3-core để decode chuẩn.
            // Ở đây giả định cấu trúc JSON trả về từ ví có chứa 'proof' và 'pub_signals'
            
            // Lưu ý: Contract Validator cần inputs dạng bytes. 
            // Đây là mock parse để demo luồng dữ liệu.
            return {
                response: proofJson.proof || "0x", // Bytes proof
                inputs: proofJson.pub_signals || "0x" // Bytes public signals
            };
        } catch (e) {
            console.error("Invalid proof format", e);
            return null;
        }
    }
}