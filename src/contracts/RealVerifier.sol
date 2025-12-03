// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Verifier {
    
    // Verification Key Data (Trích xuất từ vkey.json của bạn)
    // Alpha
    uint256 constant alphax = 5854098143894057386495958106098101470595638210863540825454822974375760643520;
    uint256 constant alphay = 5627502993135470984068140122652169668094156030052888777750599668712104829183;

    // Beta
    uint256 constant betax1 = 13481566335118051532314738745783469661571474918307619521670881897210273785194;
    uint256 constant betax2 = 715822842951760235306770515854500154488044713439766541309305890106979323867;
    uint256 constant betay1 = 6627275406364044223139969342747161826495594328736845140014976148424070541418;
    uint256 constant betay2 = 15836091841423330163853976459818744628850985022394830836646336106533220477505;

    // Gamma
    uint256 constant gammax1 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant gammax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant gammay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant gammay2 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;

    // Delta
    uint256 constant deltax1 = 8495653923123431417604973247489272438418190587263600148770280649306958101930;
    uint256 constant deltax2 = 10857046999023057135944570762232829481370756359578518086990519993285655852781;
    uint256 constant deltay1 = 4082367875863433681332203403145435568316851327593401208105741076214120093531;
    uint256 constant deltay2 = 11559732032986387107991004021392285783925812861821192530917403151452391805634;

    // IC (Input Constants)
    uint256 constant IC0x = 20713575067953486541955976126673321374099257990665775194186826667377761750882;
    uint256 constant IC0y = 12040270000044932208902459307162498260089098595671908262582379925277524288378;
    
    uint256 constant IC1x = 5080194083344413024926854567052201947352664300956818536835481165614846336669;
    uint256 constant IC1y = 20231031420564664787476419889819472933156743668621052823956394626494954036347;
    
    uint256 constant IC2x = 4845631372020369031432569887505068813623632454103518743400783452506063453125;
    uint256 constant IC2y = 3885913996450668655177892024475619199091218807616335341555136861837836986139;
    
    uint256 constant IC3x = 3484852565353988730726917833165060085308896486276198118054218394569218418044;
    uint256 constant IC3y = 1747129012108592944343909039732990915347846087852773242011122516824953737330;
    
    uint256 constant IC4x = 1094109381133220671370018180342980690649262004274728877687802540270729664791;
    uint256 constant IC4y = 8189132818861789329658866908922075823025752566584626139471956721585035825954;
    
    uint256 constant IC5x = 12170949411376583422022172249923080659204051697086226083746062860728429120121;
    uint256 constant IC5y = 14193443377690305886364363132000773909277734286704455726768846096949701107009;

    // SNARK scalar field
    uint256 constant snark_scalar_field = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    // Prime field
    uint256 constant PRIME_Q = 21888242871839275222246405745257275088696311157297823662689037894645226208583;

    struct Proof {
        Pairing.G1Point a;
        Pairing.G2Point b;
        Pairing.G1Point c;
    }

    using Pairing for *;

    // Hàm xác thực toán học
    function verifyProof(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256[5] memory input
    ) public view returns (bool) {
        Proof memory proof;
        proof.a = Pairing.G1Point(a[0], a[1]);
        proof.b = Pairing.G2Point([b[0][0], b[0][1]], [b[1][0], b[1][1]]);
        proof.c = Pairing.G1Point(c[0], c[1]);

        // Tính toán linear combination của public inputs
        Pairing.G1Point memory vk_x = Pairing.G1Point(IC0x, IC0y);
        
        vk_x = Pairing.plus(vk_x, Pairing.scalar_mul(Pairing.G1Point(IC1x, IC1y), input[0]));
        vk_x = Pairing.plus(vk_x, Pairing.scalar_mul(Pairing.G1Point(IC2x, IC2y), input[1]));
        vk_x = Pairing.plus(vk_x, Pairing.scalar_mul(Pairing.G1Point(IC3x, IC3y), input[2]));
        vk_x = Pairing.plus(vk_x, Pairing.scalar_mul(Pairing.G1Point(IC4x, IC4y), input[3]));
        vk_x = Pairing.plus(vk_x, Pairing.scalar_mul(Pairing.G1Point(IC5x, IC5y), input[4]));

        return Pairing.pairingProd4(
            proof.a, Pairing.G2Point([betax2, betax1], [betay2, betay1]),
            Pairing.negate(vk_x), Pairing.G2Point([gammax2, gammax1], [gammay2, gammay1]),
            Pairing.negate(proof.c), Pairing.G2Point([deltax2, deltax1], [deltay2, deltay1]),
            Pairing.negate(Pairing.G1Point(alphax, alphay)), Pairing.G2Point([betax2, betax1], [betay2, betay1])
        );
    }

    // Hàm wrapper cho ZKFirmaDigitalVote gọi vào
    function verifyZKFirmaDigitalProof(
        uint256 nullifierSeed,
        uint256 nullifier,
        uint256 signal,
        uint256[1] memory revealArray,
        uint256[8] memory groth16Proof
    ) public view returns (bool) {
        // Chuyển đổi format proof
        uint256[2] memory a = [groth16Proof[0], groth16Proof[1]];
        uint256[2][2] memory b = [[groth16Proof[2], groth16Proof[3]], [groth16Proof[4], groth16Proof[5]]];
        uint256[2] memory c = [groth16Proof[6], groth16Proof[7]];

        // Public Key Hash hardcoded từ frontend constants/index.ts
        uint256 publicKeyHash = 15100764808137121660160871414130376377652473835020058565951744372715764457760;

        // Sắp xếp input theo đúng thứ tự mạch (Public Signals)
        // Dựa trên vkey.json nPublic=5. Thứ tự thường là:
        // [publicKeyHash, nullifier, revealArray[0], nullifierSeed, signal]
        uint256[5] memory input = [
            publicKeyHash,
            nullifier,
            revealArray[0],
            nullifierSeed,
            signal
        ];

        return verifyProof(a, b, c, input);
    }
}

// Thư viện toán học Elliptic Curve Pairing cho BN128
library Pairing {
    struct G1Point { uint256 X; uint256 Y; }
    struct G2Point { uint256[2] X; uint256[2] Y; }

    function P1() internal pure returns (G1Point memory) {
        return G1Point(1, 2);
    }

    function negate(G1Point memory p) internal pure returns (G1Point memory) {
        if (p.X == 0 && p.Y == 0) return G1Point(0, 0);
        return G1Point(p.X, 21888242871839275222246405745257275088696311157297823662689037894645226208583 - p.Y);
    }

    function plus(G1Point memory p1, G1Point memory p2) internal view returns (G1Point memory r) {
        uint256[4] memory input;
        input[0] = p1.X; input[1] = p1.Y; input[2] = p2.X; input[3] = p2.Y;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 6, input, 0xc0, r, 0x60)
        }
        require(success, "pairing-add-failed");
    }

    function scalar_mul(G1Point memory p, uint256 s) internal view returns (G1Point memory r) {
        uint256[3] memory input;
        input[0] = p.X; input[1] = p.Y; input[2] = s;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 7, input, 0x80, r, 0x60)
        }
        require(success, "pairing-mul-failed");
    }

    function pairing(G1Point memory a1, G2Point memory a2, G1Point memory b1, G2Point memory b2, G1Point memory c1, G2Point memory c2, G1Point memory d1, G2Point memory d2) internal view returns (bool) {
        uint256[24] memory input;
        input[0] = a1.X; input[1] = a1.Y;
        input[2] = a2.X[1]; input[3] = a2.X[0]; input[4] = a2.Y[1]; input[5] = a2.Y[0];
        input[6] = b1.X; input[7] = b1.Y;
        input[8] = b2.X[1]; input[9] = b2.X[0]; input[10] = b2.Y[1]; input[11] = b2.Y[0];
        input[12] = c1.X; input[13] = c1.Y;
        input[14] = c2.X[1]; input[15] = c2.X[0]; input[16] = c2.Y[1]; input[17] = c2.Y[0];
        input[18] = d1.X; input[19] = d1.Y;
        input[20] = d2.X[1]; input[21] = d2.X[0]; input[22] = d2.Y[1]; input[23] = d2.Y[0];
        uint256[1] memory out;
        bool success;
        assembly {
            success := staticcall(sub(gas(), 2000), 8, input, 768, out, 0x20)
        }
        require(success, "pairing-opcode-failed");
        return out[0] != 0;
    }

    function pairingProd4(
        G1Point memory a1, G2Point memory a2,
        G1Point memory b1, G2Point memory b2,
        G1Point memory c1, G2Point memory c2,
        G1Point memory d1, G2Point memory d2
    ) internal view returns (bool) {
        return pairing(a1, a2, b1, b2, c1, c2, d1, d2);
    }
}