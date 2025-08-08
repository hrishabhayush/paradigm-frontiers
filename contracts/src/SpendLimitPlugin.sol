// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../Verifier.sol";

error InvalidRelayer(address sender);
error InvalidProof();

contract SpendLimitPlugin is Groth16Verifier {
    struct Config {
        uint256 spendLimit;
        address relayerAddress;
        address recoveryAddress;
    }

    Config public config;

    event ProofVerified(address indexed relayer);

    function setConfig(Config calldata cfg) external {
        config = cfg;
    }

    function executeWithProof(
        bytes calldata /*txData*/,
        uint[2] calldata pA,
        uint[2][2] calldata pB,
        uint[2] calldata pC,
        uint[] calldata publicInputs
    ) external {
        if (msg.sender != config.relayerAddress) {
            revert InvalidRelayer(msg.sender);
        }

        require(publicInputs.length == 0, "unexpected public inputs");
        uint[] memory empty;
        bool ok = verifyProof(pA, pB, pC, empty);
        if (!ok) revert InvalidProof();

        emit ProofVerified(msg.sender);
    }
}


