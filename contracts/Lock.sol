// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title Lock
 * @dev A simple smart contract that locks funds until a specific unlock time
 */
contract Lock {
    uint256 public unlockTime;
    address payable public owner;

    event Withdrawal(uint256 amount, uint256 when);

    /**
     * @dev Constructor sets the unlock time and owner
     * @param _unlockTime The timestamp when the funds can be withdrawn
     */
    constructor(uint256 _unlockTime) payable {
        require(
            block.timestamp < _unlockTime,
            "Unlock time should be in the future"
        );

        unlockTime = _unlockTime;
        owner = payable(msg.sender);
    }

    /**
     * @dev Withdraw funds after unlock time has passed
     */
    function withdraw() public {
        require(block.timestamp >= unlockTime, "You can't withdraw yet");
        require(msg.sender == owner, "You aren't the owner");

        emit Withdrawal(address(this).balance, block.timestamp);

        owner.transfer(address(this).balance);
    }
}
