// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// MockVerifier luôn trả về true cho mọi bằng chứng
contract Verifier {
    
    // Hàm này khớp với signature của hàm verifyZKFirmaDigitalProof trong Verifier thật
    function verifyZKFirmaDigitalProof(
        uint256, // nullifierSeed (không dùng)
        uint256, // nullifier (không dùng)
        uint256, // signal (không dùng)
        uint256[1] memory, // revealArray (không dùng)
        uint256[8] memory // groth16Proof (không dùng)
    ) public pure returns (bool) {
        // Luôn trả về true để bypass bước xác thực ZK
        return true;
    }

    // Hàm verifyProof gốc (nếu có gọi trực tiếp) cũng trả về true
    function verifyProof(
        uint256[2] memory,
        uint256[2][2] memory,
        uint256[2] memory,
        uint256[5] memory
    ) public pure returns (bool) {
        return true;
    }
}