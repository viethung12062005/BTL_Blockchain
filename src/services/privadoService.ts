import { CONFIG } from '../config';

export interface VerificationRequest {
  electionId: number;
  schemaType: string;
  query: any; // MỚI: Nhận object query từ Frontend truyền vào
}

export interface VerificationLinkResponse {
  link: string;
  sessionId: string;
}

export interface VerificationStatusResponse {
  status: 'pending' | 'verified' | 'failed';
  proof?: any;
}

const NGROK_URL = process.env.REACT_APP_NGROK_URL || "http://localhost:8000";
const LOCAL_RELAY = "http://localhost:8000"; 

const DEFAULT_CONTEXT = "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld";
const PROOF_OF_HUMANITY_CONTEXT = "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/proof-of-humanity.json-ld";

const SCHEMA_MAP: Record<string, string> = {
  "KYCAgeCredential": DEFAULT_CONTEXT,
  "KYCCountryOfResidenceCredential": DEFAULT_CONTEXT,
  "ProofOfHumanity": PROOF_OF_HUMANITY_CONTEXT,
  "VotingCredential": DEFAULT_CONTEXT,
};

export class PrivadoIDService {
  
  static async requestVerificationLink(req: VerificationRequest): Promise<VerificationLinkResponse> {
    const sessionId = crypto.randomUUID();
    const callbackUrl = `${NGROK_URL}/api/callback?sessionId=${sessionId}&electionId=${req.electionId}`;

    const targetSchema = req.schemaType || "VotingCredential";
    const schemaUrl = SCHEMA_MAP[targetSchema] || CONFIG.SCHEMA_URL || DEFAULT_CONTEXT;

    // Sử dụng Query được truyền vào từ tham số (Lấy từ Contract)
    // Nếu req.query là string JSON thì parse ra, nếu là object thì dùng luôn
    let credentialSubjectQuery = req.query;
    if (typeof credentialSubjectQuery === 'string') {
        try {
            credentialSubjectQuery = JSON.parse(credentialSubjectQuery);
        } catch (e) {
            console.error("Invalid Query JSON", e);
            credentialSubjectQuery = {}; // Fallback an toàn
        }
    }

    console.log(`🚀 Creating Request: Election #${req.electionId}`);
    console.log(`   Schema: ${targetSchema}`);
    console.log(`   Query:`, JSON.stringify(credentialSubjectQuery));

    const requestBody = {
      id: sessionId,
      typ: "application/iden3comm-plain-json",
      type: "https://iden3-communication.io/authorization/1.0/request",
      thid: sessionId,
      body: {
        callbackUrl: callbackUrl,
        reason: `Verify eligibility for Election #${req.electionId}`,
        scope: [
          {
            id: 1,
            circuitId: "credentialAtomicQuerySigV2",
            query: {
              allowedIssuers: ["*"],
              type: targetSchema,
              context: schemaUrl,
              credentialSubject: credentialSubjectQuery, // Dùng query động
              skipClaimRevocationCheck: true 
            }
          }
        ]
      },
      from: "did:polygonid:polygon:amoy:2qQ68JkRcf3xrHPQPWZei3YeVzHPP58wYNxx2mEouR"
    };

    try {
      await fetch(`${LOCAL_RELAY}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, electionId: req.electionId })
      });
    } catch (e) {}

    return {
      link: JSON.stringify(requestBody),
      sessionId: sessionId
    };
  }

  static async checkVerificationStatus(sessionId: string): Promise<VerificationStatusResponse> {
    try {
      const response = await fetch(`${LOCAL_RELAY}/api/proof?sessionId=${sessionId}`);
      if (!response.ok) return { status: 'pending' };
      const data = await response.json();
      if (data.status === 'done') {
        return { status: 'verified', proof: data.proof };
      }
    } catch (error) {}
    return { status: 'pending' };
  }
}