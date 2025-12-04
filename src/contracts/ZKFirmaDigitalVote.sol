// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Interface của Privado ID Validator (Universal Verifier)
interface ICircuitValidator {
    function verify(
        bytes memory response,
        bytes memory inputs,
        address challengeSender,
        address sender
    ) external view returns (bool);
}

contract ZKFirmaDigitalVote {
    string public votingQuestion;
    address public validatorAddress; // Địa chỉ Universal Validator

    struct Proposal {
        string description;
        uint256 voteCount;
    }

    Proposal[] public proposals;
    
    // Nullifier map để chống double-voting
    mapping(uint256 => bool) public nullifiers;

    event Voted(uint256 proposalIndex, uint256 nullifier);

    constructor(
        string memory _votingQuestion,
        string[] memory proposalDescriptions,
        address _validatorAddress
    ) {
        votingQuestion = _votingQuestion;
        validatorAddress = _validatorAddress;
        
        for (uint256 i = 0; i < proposalDescriptions.length; i++) {
            proposals.push(Proposal(proposalDescriptions[i], 0));
        }
    }

    /**
     * @dev Hàm bỏ phiếu (Vote) sử dụng Privado ID Proof
     * @param proposalIndex Chỉ số của ứng cử viên
     * @param response Bằng chứng ZK (Proof) dạng bytes
     * @param inputs Public Signals dạng bytes
     */
    function voteForProposal(
        uint256 proposalIndex,
        bytes memory response, 
        bytes memory inputs
    ) public {
        require(proposalIndex < proposals.length, "Invalid proposal index");

        // 1. GỌI VALIDATOR CỦA PRIVADO ID ĐỂ KIỂM TRA PROOF
        // - address(this): Contract này là người yêu cầu (Challenge Sender)
        // - msg.sender: Người gửi transaction (Identity Owner)
        require(
            ICircuitValidator(validatorAddress).verify(
                response,
                inputs,
                address(this), 
                msg.sender
            ),
            "Privado ID: Proof is invalid"
        );

        // 2. CHỐNG DOUBLE-VOTING
        // Lấy Nullifier từ inputs (giả lập bằng hash để đơn giản hóa demo)
        // Trong thực tế: Cần decode bytes inputs để lấy vị trí chính xác của Nullifier
        uint256 nullifier = uint256(keccak256(response)); 

        require(!nullifiers[nullifier], "User has already voted");

        // 3. GHI NHẬN PHIẾU BẦU
        nullifiers[nullifier] = true;
        proposals[proposalIndex].voteCount++;

        emit Voted(proposalIndex, nullifier);
    }

    // --- CÁC HÀM VIEW (GETTER) ---

    function getProposalCount() public view returns (uint256) {
        return proposals.length;
    }

    function getProposal(uint256 index) public view returns (string memory, uint256) {
        require(index < proposals.length, "Index out of bounds");
        return (proposals[index].description, proposals[index].voteCount);
    }
    
    function getTotalVotes() public view returns (uint256) {
        uint256 totalVotes = 0;
        for (uint256 i = 0; i < proposals.length; i++) {
            totalVotes += proposals[i].voteCount;
        }
        return totalVotes;
    }

    // Tương thích với frontend cũ nếu cần
    function checkVoted(uint256 _nullifier) public view returns (bool) {
        return nullifiers[_nullifier];
    }
}