import axios from 'axios';

const VERIFICATOR_BASE_URL = process.env.REACT_APP_VERIFICATOR_URL || 'https://passport.sakundi.io';
const AUTH_SERVER_URL = process.env.REACT_APP_AUTH_SERVER_URL || 'https://app.sakundi.io';

export interface VerificationRequest {
  userId: string;
  nationality: string;
  eventId: string;
}

export interface VerificationLinkResponse {
  link: string;
  status: string;
  get_proof_params?: string;
}

export interface VerificationStatusResponse {
  status: 'pending' | 'verified' | 'failed';
  proof?: any;
}

export class PassportVerificationService {
  
  static async requestVerificationLink(request: VerificationRequest): Promise<VerificationLinkResponse> {
    const queryParams = {
      // Lưu ý: OAuth chuẩn thường dùng 'response_type', nhưng giữ 'grant_type' 
      // nếu backend của bạn yêu cầu đặc biệt như vậy.
      grant_type: "code",
      client_id: process.env.REACT_APP_CLIENT_ID || "hello@example.com",
      user_id: request.userId,
      redirect_uri: process.env.REACT_APP_REDIRECT_URI || `${window.location.origin}/vote/passport/callback`,
      scope: "zk-passport",
      state: String(Math.floor(Math.random() * 10000)),
      nullifier_seed: "1000",
      data: encodeURIComponent(
        JSON.stringify({
          "id": request.userId,
          "type": "user",
          "attributes": {
            "age_lower_bound": 18,
            "uniqueness": true,
            "nationality": request.nationality,
            "nationality_check": true,
            "event_id": request.eventId,
          }
        })
      )
    };

    // Chuyển đổi params thành chuỗi query string
    const queryString = new URLSearchParams(queryParams as any).toString();
    const authUrl = `${AUTH_SERVER_URL}/authorize?${queryString}`;
    
    // FIX: Không gọi axios.get(authUrl) ở đây vì đây là URL để người dùng truy cập (QR code/Redirect)
    // Thay vào đó, trả về URL trực tiếp.
    return Promise.resolve({
      link: authUrl,
      status: 'created',
      // get_proof_params sẽ được xử lý bởi fallback trong requestVerificationWithParams nếu cần
    });
  }

  static async checkVerificationStatus(userId: string): Promise<VerificationStatusResponse> {
    try {
      const response = await axios.get(
        `${AUTH_SERVER_URL}/check-validated?user_id=${userId}&scope=zk-passport`
      );
      
      return {
        status: response.data.status,
        proof: response.data.proof
      };
    } catch (error) {
      console.error('Error checking verification status:', error);
      // Trả về pending thay vì throw error để tránh crash UI khi polling
      return { status: 'pending' };
    }
  }

  static async getProofParams(proofParamsUrl: string): Promise<any> {
    try {
      const response = await axios.get(proofParamsUrl);
      return response.data;
    } catch (error) {
      console.error('Error getting proof params:', error);
      throw new Error('Failed to get proof parameters');
    }
  }

  static async exchangeCodeForToken(code: string, userId: string): Promise<any> {
    const tokenUrl = `${AUTH_SERVER_URL}/token`;
    
    const data = new URLSearchParams({
      code: code,
      client_id: process.env.REACT_APP_CLIENT_ID || "hello@example.com",
      client_secret: process.env.REACT_APP_CLIENT_SECRET || "password",
      redirect_uri: process.env.REACT_APP_REDIRECT_URI || `${window.location.origin}/vote/passport/callback`,
      scope: "zk-passport",
      grant_type: 'authorization_code'
    });

    try {
      const response = await axios.post(tokenUrl, data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw new Error('Failed to exchange authorization code');
    }
  }

  static generateDeepLink(proofParamsUrl: string): string {
    const deepLinkUrl = new URL('rarime://external');
    deepLinkUrl.searchParams.append('type', 'proof-request');
    deepLinkUrl.searchParams.append('proof_params_url', proofParamsUrl);
    
    return deepLinkUrl.toString();
  }

  static isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  static async requestVerificationWithParams(request: VerificationRequest): Promise<{ get_proof_params: string }> {
    const eventId = request.eventId || 'default-event';
    
    try {
      const response = await this.requestVerificationLink(request);
      
      if (response.get_proof_params) {
        return { get_proof_params: response.get_proof_params };
      }
      
      // Fallback: construct parameters if not provided by server
      return {
        get_proof_params: `${VERIFICATOR_BASE_URL}/verificator/proof-params?` + new URLSearchParams({
          id: request.userId.toLowerCase(),
          event_id: eventId,
          uniqueness: 'true',
          expiration_lower_bound: 'true'
        }).toString()
      };
    } catch (error) {
      console.error('Error requesting verification with params:', error);
      throw error;
    }
  }
}