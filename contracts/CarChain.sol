//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./CarToken.sol";
import "./CarPurchase.sol";

//This contract has a central deployment authority.
//After setup, the deployer can relinquish his control by calling renounceOwnership, and the system is decentralized once more.
contract CarChain is Ownable {

	address private _dealerAddr;
	address private _bankAddr;
	address private _stateAddr;
	address private _insnAddr;
	
	//Address of the CarToken instance.
	address immutable _carToken;
	
	//Mapping of buyer addresses to CarPurchase instance addresses.
	mapping(address => address) private pendingPurchases;
	
	//Mapping of CarPurchase instance to buyer addresses.
	mapping(address => address) private pendingPurchasesReverse;

	constructor(address carTokenAddr){
		_carToken = carTokenAddr;
	}

	function setDealer(address addr) public onlyOwner {
        _dealerAddr = addr;
    }
	
	function setBank(address addr) public onlyOwner {
        _bankAddr = addr;
    }
	
	function setState(address addr) public onlyOwner {
        _stateAddr = addr;
    }
	
	function setInsurance(address addr) public onlyOwner {
        _insnAddr = addr;
    }
	
	function getDealer() public view returns (address){
		return _dealerAddr;
	}
	
	function getBank() public view returns (address){
		return _bankAddr;
	}
	
	function getState() public view returns (address){
		return _stateAddr;
	}
	
	function getInsurance() public view returns (address){
		return _insnAddr;
	}
	
	/**
	* A function to retrieve all cars owned by the _dealerAddr.
	* Returns them as an array.
	*/
	function getDealerCars() public view returns (uint256[] memory) {
		CarToken carToken = CarToken(_carToken);
		uint256 amount = carToken.balanceOf(_dealerAddr);
		uint256[] memory arr = new uint256[](amount);
		for(uint256 i = 0; i < amount; i++){
			arr[i] = carToken.tokenOfOwnerByIndex(_dealerAddr, i);
		}
		return arr;
	}
	
	/**
	* Starts a new purchase with the sender as the buyer.
	* Locks this vin# from new purchases until this purchase completes or fails.
	*/
	function startPurchase(uint256 vin) public {
		require(pendingPurchases[msg.sender] == address(0)); //Cannot start a purchase while one is pending.
		require(!CarToken(_carToken).isPendingPurchase(vin)); //Cannot start a purchase for a vehicle that is being bought.
		CarPurchase p = new CarPurchase(msg.sender, vin);
		pendingPurchases[msg.sender] = address(p);
		pendingPurchasesReverse[address(p)] = msg.sender;
	}
	
	function completePurchase() public {
		require(pendingPurchasesReverse[msg.sender] != address(0)); //Cannot complete a purchase that does not exist.
		address buyer = pendingPurchasesReverse[msg.sender];
		pendingPurchasesReverse[msg.sender] = address(0);
		pendingPurchases[buyer] = address(0);
		CarPurchase purchase = CarPurchase(msg.sender);
		if(purchase.getState() == CarPurchase.PurchaseState.APPROVED){
			CarToken(_carToken).safeTransferFrom(_dealerAddr, buyer, purchase.getVin());
		}
	}
}