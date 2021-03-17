//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./CarChain.sol";

/**
* This contract represents an in-progress purchase.
* The owner of this contract will always be the CarChain.
* Any other deployments are invalid.
*/
contract CarPurchase is Ownable {

	enum PurchaseState {
		STARTED,         //Purchase started.  Buyer can upload documents.
		//TODO: Bank step needs to be different, loan app needs to be 
		//non-binary response, which returns loan amt and APR with acceptance capability.
		AWAITING_BANK,   //Needs bank approval for loan
		DECLINED_BANK,   //If bank declines, we need to wait for new documents to the bank.
		AWAITING_INSN,   //Needs insurance approval for purchase.
		DECLINED_INSN,   //Declined by insurance.
		AWAITING_STATE,  //Awaiting DMV approval.
		DECLINED_STATE,  //Declined by DMV.
		AWAITING_DEALER, //Awaiting dealer confirmation
		APPROVED, 		 //Terminal State
		DECLINED 		 //Terminal State
	}

	PurchaseState private state = PurchaseState.STARTED;
	address private immutable _buyerAddr;
	uint256 private immutable vin;
	mapping(address => string) private documents;

	modifier onlyBuyer() { require(msg.sender == _buyerAddr, "Only the buyer can call this method."); _; }

	constructor(address buyer, uint256 _vin){
		_buyerAddr = buyer;
		vin = _vin;
	}

	function uploadDocuments(address target, string memory cid) public onlyBuyer {
		require(state == PurchaseState.STARTED);
		documents[target] = cid;
		CarChain chain = CarChain(owner());
		if( strlen(documents[chain.getDealer()]) != 0 && strlen(documents[chain.getBank()]) != 0 && 
			strlen(documents[chain.getState()]) != 0 && strlen(documents[chain.getInsurance()]) != 0) {
			state = PurchaseState.AWAITING_BANK;
		}
	}
	
	function getState() public view returns (PurchaseState) {
		return state;
	}
	
	function getVin() public view returns (uint256) {
		return vin;
	}
	
	function getMyDocuments() public view returns (string memory) {
		return documents[msg.sender];
	}
	
	function bankInput(bool approve) public {
		require(msg.sender == CarChain(owner()).getBank(), "Only the bank can provide bank input.");
		require(state == PurchaseState.AWAITING_BANK, "Not presently awaiting bank input.");
		if(approve){
			state = PurchaseState.AWAITING_INSN;
		} else {
			state = PurchaseState.DECLINED_BANK;
		}
	}
	
	function insnInput(bool approve) public {
		require(msg.sender == CarChain(owner()).getInsurance(), "Only the insurance can provide insurance input.");
		require(state == PurchaseState.AWAITING_INSN, "Not presently awaiting insurance input.");
		if(approve){
			state = PurchaseState.AWAITING_STATE;
		} else {
			state = PurchaseState.DECLINED_INSN;
		}
	}
	
	function stateInput(bool approve) public {
		require(msg.sender == CarChain(owner()).getState(), "Only the state can provide state input.");
		require(state == PurchaseState.AWAITING_STATE, "Not presently awaiting state input.");
		if(approve){
			state = PurchaseState.AWAITING_DEALER;
		} else {
			state = PurchaseState.DECLINED_STATE;
		}
	}
	
	function dealerInput(bool approve) public {
		require(msg.sender == CarChain(owner()).getDealer(), "Only the dealer can provide dealer input.");
		require(state == PurchaseState.AWAITING_DEALER, "Not presently awaiting dealer input.");
		if(approve){
			state = PurchaseState.APPROVED;
		} else {
			state = PurchaseState.DECLINED;
		}
		CarChain(owner()).completePurchase();
	}
	
	function abort() public onlyBuyer {
		state = PurchaseState.DECLINED;
		CarChain(owner()).completePurchase();
	}
	
	function strlen(string memory str) public pure returns (uint) {
		return bytes(str).length;
	}
	
}