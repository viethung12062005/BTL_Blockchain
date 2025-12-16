// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IZKFirmaDigitalVote {
    struct Proposal {
        string description;
        uint256 voteCount;
    }

    event Voted(address indexed _from, uint256 indexed _propositionIndex);

    function voteForProposal(
        uint256 proposalIndex,
        uint nullifierSeed,
        uint nullifier,
        uint signal,
        uint[1] calldata revealArray,
        uint[8] calldata groth16Proof
    ) external;

    function getProposalCount() external view returns (uint256);
    function getProposal(uint256 proposalIndex) external view returns (string memory, uint256);
    function getTotalVotes() external view returns (uint256);
    function checkVoted(uint256 _nullifier) external view returns (bool);
}
