// File: src/data/polygonIdSchemas.ts

export const KYCV3_CONTEXT = "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/kyc-v3.json-ld";
export const PROOF_OF_HUMANITY_CONTEXT = "https://raw.githubusercontent.com/iden3/claim-schema-vocab/main/schemas/json-ld/proof-of-humanity.json-ld";

export interface SchemaField {
  key: string;
  label: string;
  type: 'date' | 'number' | 'select' | 'boolean';
  options?: { value: number | string; label: string }[]; // Dùng cho loại select
  operator: '$eq' | '$lt' | '$gt' | '$in' | '$nin';
  description?: string;
}

export interface PolygonSchema {
  type: string;
  name: string;
  description: string;
  context: string;
  fields: SchemaField[];
}

export const AVAILABLE_SCHEMAS: PolygonSchema[] = [
  {
    type: "KYCAgeCredential",
    name: "🔞 KYC Age Credential",
    description: "Xác minh độ tuổi của người dùng (Ví dụ: Trên 18 tuổi).",
    context: KYCV3_CONTEXT,
    fields: [
      {
        key: "birthday",
        label: "Sinh trước ngày (YYYY-MM-DD)",
        type: "date",
        operator: "$lt",
        description: "Người dùng phải có ngày sinh nhỏ hơn ngày này."
      }
    ]
  },
  {
    type: "KYCCountryOfResidenceCredential",
    name: "🌍 KYC Country of Residence",
    description: "Xác minh quốc gia cư trú của người dùng.",
    context: KYCV3_CONTEXT,
    fields: [
      {
        key: "countryCode",
        label: "Quốc gia cho phép",
        type: "select",
        operator: "$in",
        options: [
          { value: 704, label: "Vietnam (704)" },
          { value: 840, label: "USA (840)" },
          { value: 392, label: "Japan (392)" },
          { value: 410, label: "South Korea (410)" },
          { value: 156, label: "China (156)" },
          // Bạn có thể thêm danh sách ISO 3166 numeric code ở đây
        ]
      }
    ]
  },
  {
    type: "ProofOfHumanity",
    name: "👤 Proof of Humanity",
    description: "Xác minh người dùng là con người thực (chống bot).",
    context: PROOF_OF_HUMANITY_CONTEXT,
    fields: [] // Không cần query field, chỉ cần sở hữu là được
  },
  {
    type: "KYCEmployee",
    name: "💼 KYC Employee",
    description: "Xác minh nhân viên công ty/tổ chức.",
    context: KYCV3_CONTEXT,
    fields: [
      {
        key: "income",
        label: "Thu nhập tối thiểu (hàng tháng)",
        type: "number",
        operator: "$gt"
      }
    ]
  }
];