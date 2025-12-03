// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IZKFirmaDigital {
    function verifyZKFirmaDigitalProof(
        uint256 nullifierSeed,
        uint256 nullifier,
        uint256 signal,
        uint256[1] calldata revealArray,
        uint256[8] calldata groth16Proof
    ) external view returns (bool);
}