//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
* Non-Fungible Token to represent a car.
* The token's ID is the Car's VIN #.  No other data need be stored with this token.
*/
contract CarToken is ERC721Enumerable, Ownable {

    //Address of the CarChain that controls this token instance.
    address private _carChain;

    //Address of the car manufacturer.
    address private manufacturer;
    
    //Mapping of token ids to their pending purchase state.
    mapping(uint256 => bool) private pendingPurchase;
   
    constructor() ERC721("CarToken", "CAR") {}
    
    modifier onlyManufacturer() { require(msg.sender == manufacturer, "Only the manufacturer can generate new cars."); _; }
    modifier onlyChain() { require(msg.sender == _carChain, "Only the car chain can change pending state."); _; }
    
    /**
    * Changes the manufacturer.  Only accessible by deployer.
    */
    function setManufacturer(address addr) public onlyOwner {
        manufacturer = addr;
    }
    
    /**
    * Sets the car chain address.  Only accessible by deployer.
    */
    function setCarChain(address addr) public onlyOwner {
        _carChain = addr;
    }
    
    /*
    * Creates a new car token on the chain.
    * The token's owner will be set to <defOwner> and it's vin will be <vin>.
    * This will error if defOwner is not capable of receiving ERC721 tokens.
    * Only the manufacturer can create new car tokens.
    */
    function newCar(address defOwner, uint256 vin) public virtual onlyManufacturer {
        _safeMint(defOwner, vin);
    }
    
    /**
    * Changes the pending sale state of a car token.
    * Can only be executed by the Car Chain as part of the purchasing process.
    */
    function setPending(uint256 vin, bool pending) public onlyChain {
        require(_exists(vin), "Attempted to change the pending state of a non-existant token.");
        pendingPurchase[vin] = pending;
    }
    
    /**
    * Checks if a specific car is pending a purchase by a buyer.
    */
    function isPendingPurchase(uint256 vin) public view returns (bool) {
        require(_exists(vin), "Attempted to view the pending state of a non-existant token.");
        return pendingPurchase[vin];
    }
    
    /**
    * Public view of the _exists function, which checks if a token exists.
    */
    function exists(uint256 vin) public view returns (bool) {
        return _exists(vin);
    }
}