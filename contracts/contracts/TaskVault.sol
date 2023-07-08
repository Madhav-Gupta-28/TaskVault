// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;


import "./NFTCollection.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";



contract TaskVault is ReentrancyGuard {

    // instance of nft contract
    TaskVaultNFT  public  taskvaultNFT;

    struct LockedFunds{
        uint256 lockedupfund;
        uint256  deadline;
    }

    event LockedFundsEvent(uint256 indexed amount , uint256 deadline);

    // mapping for users to locked up funds 
    mapping(address => LockedFunds) public addressTofunds;


    constructor(address nftCollectionAddress) {
        taskvaultNFT = TaskVaultNFT(nftCollectionAddress);
    }
    

    function deposit(uint256 amount , uint256 timelock) public payable nonReentrant {
        // check
        require(msg.value >= amount,"Less than inputed amount");

        // depositing funds
        addressTofunds[msg.sender] = LockedFunds(amount , block.timestamp + timelock);

        //emiting event
        emit LockedFundsEvent(amount , timelock);
    }

    function withdraw() public payable nonReentrant {

        //checks 
        require(block.timestamp >=  addressTofunds[msg.sender].deadline,"Deadline has been not passed yet");
        require(addressTofunds[msg.sender].lockedupfund > 0 ,"Locked Up Amount is zero");
        require(taskvaultNFT.balanceOf(msg.sender)  > 0 ,"You don't have an NFT from Collection");

        // transferring funds 
        (bool success,) = payable(msg.sender).call{value: addressTofunds[msg.sender].lockedupfund}("");
        require(success , "Withdraw failed");

        // deleting the mapping
        delete addressTofunds[msg.sender];

    }



}