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

	//Current State of this transaction.
	PurchaseState private state = PurchaseState.STARTED;
	
	//Address of the buyer of this transaction.
	address private immutable _buyerAddr;
	
	//Address of the vin# of this transaction.
	uint256 private immutable vin;
	
	//Mapping of receiver -> uploaded document CID for files the buyer has provided.
	mapping(address => string) private documents;

	modifier onlyBuyer() { require(msg.sender == _buyerAddr, "Only the buyer can call this method."); _; }

	constructor(address buyer, uint256 _vin){
		_buyerAddr = buyer;
		vin = _vin;
	}

	/**
	* Function for the buyer to upload documents.
	* The files should be encrypted and have to be uploaded to IPFS externally.
	* The blockchain only stores the CID of files.
	* Transitions to state AWAITING_BANK when all documents are provided.
	*/
	function uploadDocuments(address target, string memory cid) public onlyBuyer {
		require(state == PurchaseState.STARTED);
		documents[target] = cid;
		CarChain chain = CarChain(owner());
		if(strlen(documents[chain.getDealer()]) != 0 && strlen(documents[chain.getBank()]) != 0 && 
		   strlen(documents[chain.getState()]) != 0 && strlen(documents[chain.getInsurance()]) != 0) {
			state = PurchaseState.AWAITING_BANK;
		}
	}
	
	/**
	* Breakout function if declined by the bank.
	* When declined, the buyer must reupload new documents to attempt again.
	*/
	function reuploadBank(string memory cid) public onlyBuyer {
		require(state == PurchaseState.DECLINED_BANK);
		documents[CarChain(owner()).getBank()] = cid;
		state = PurchaseState.AWAITING_BANK;
	}
	
	/**
	* Breakout function if declined by insurance.
	* When declined, the buyer must reupload new documents to attempt again.
	*/
	function reuploadInsn(string memory cid) public onlyBuyer {
		require(state == PurchaseState.DECLINED_INSN);
		documents[CarChain(owner()).getInsurance()] = cid;
		state = PurchaseState.AWAITING_INSN;
	}
	
	/**
	* Breakout function if declined by the state.
	* When declined, the buyer must reupload new documents to attempt again.
	*/
	function reuploadState(string memory cid) public onlyBuyer {
		require(state == PurchaseState.DECLINED_STATE);
		documents[CarChain(owner()).getState()] = cid;
		state = PurchaseState.AWAITING_STATE;
	}
	
	/**
	* Returns the current state of this purchase.
	*/
	function getState() public view returns (PurchaseState) {
		return state;
	}
	
	/**
	* Returns the VIN # associated with this purchase.
	*/
	function getVin() public view returns (uint256) {
		return vin;
	}
	
	/**
	* Returns the CID of whatever document this member needs to view.
	*/
	function getMyDocuments() public view returns (string memory) {
		return documents[msg.sender];
	}
	
	/**
	* Allows the bank to approve or decline their step in the process.
	*/
	function bankInput(bool approve) public {
		require(msg.sender == CarChain(owner()).getBank(), "Only the bank can provide bank input.");
		require(state == PurchaseState.AWAITING_BANK, "Not presently awaiting bank input.");
		if(approve){
			state = PurchaseState.AWAITING_INSN;
		} else {
			state = PurchaseState.DECLINED_BANK;
		}
	}
	
	/**
	* Allows insurance to approve or decline their step in the process.
	*/
	function insnInput(bool approve) public {
		require(msg.sender == CarChain(owner()).getInsurance(), "Only the insurance can provide insurance input.");
		require(state == PurchaseState.AWAITING_INSN, "Not presently awaiting insurance input.");
		if(approve){
			state = PurchaseState.AWAITING_STATE;
		} else {
			state = PurchaseState.DECLINED_INSN;
		}
	}
	
	/**
	* Allows the state to approve or decline their step in the process.
	*/
	function stateInput(bool approve) public {
		require(msg.sender == CarChain(owner()).getState(), "Only the state can provide state input.");
		require(state == PurchaseState.AWAITING_STATE, "Not presently awaiting state input.");
		if(approve){
			state = PurchaseState.AWAITING_DEALER;
		} else {
			state = PurchaseState.DECLINED_STATE;
		}
	}
	
	/**
	* Allows the dealer to approve or decline their step in the process.
	*/
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
	
	/**
	* Allows the buyer to cancel this transaction.
	*/
	function abort() public onlyBuyer {
		require(state != PurchaseState.DECLINED && state != PurchaseState.APPROVED, "Cannot abort a completed purchase!");
		state = PurchaseState.DECLINED;
		CarChain(owner()).completePurchase();
	}
	
	/**
	* Util function that returns the length of a string.
	*/
	function strlen(string memory str) public pure returns (uint) {
		return bytes(str).length;
	}
	
}