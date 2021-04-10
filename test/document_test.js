const CarChain = artifacts.require("CarChain");
const CarToken = artifacts.require("CarToken");
const CarPurchase = artifacts.require("CarPurchase");

contract("Document Transfer Tests", async accounts => {
    it("Should set party addresses", async () => {
		const carchain = await CarChain.deployed();
		const cartoken = await CarToken.deployed();
		await cartoken.setManufacturer(accounts[0], {from: accounts[0]});
		await carchain.setDealer(accounts[1], {from: accounts[0]});
		await carchain.setBank(accounts[2], {from: accounts[0]});
		await carchain.setState(accounts[3], {from: accounts[0]});
		await carchain.setInsurance(accounts[4], {from: accounts[0]});
		await cartoken.setCarChain(carchain.address, {from: accounts[0]});
		
		var temp = await cartoken.getManufacturer({from: accounts[0]});
		assert.equal(accounts[0], temp, "Manufacturer wasn't correctly set on CarToken!");
		
		temp = await cartoken.getCarChain({from: accounts[0]});
		assert.equal(carchain.address, temp, "CarChain wasn't correctly set on CarToken!");
		
		temp = await carchain.getDealer({from: accounts[0]});
		assert.equal(accounts[1], temp, "Dealer wasn't correctly set on CarChain!");
		
		temp = await carchain.getBank({from: accounts[0]});
		assert.equal(accounts[2], temp, "Bank wasn't correctly set on CarChain!");
		
		temp = await carchain.getState({from: accounts[0]});
		assert.equal(accounts[3], temp, "State wasn't correctly set on CarChain!");
		
		temp = await carchain.getInsurance({from: accounts[0]});
		assert.equal(accounts[4], temp, "Insurance wasn't correctly set on CarChain!");
	});
	it("Should allow a buyer to start a purchase", async () => {
		const carchain = await CarChain.deployed();
		const cartoken = await CarToken.deployed();
		await cartoken.newCar(accounts[1], 200, {from: accounts[0]});
		await carchain.startPurchase(200, {from: accounts[6]});
		assert.notEqual(0, (await carchain.getMyPendingPurchase({from: accounts[6]})), "Pending purchase not created!");
	});
	it("Should allow the buyer to upload a document to each party", async () => {
		const carchain = await CarChain.deployed();
		const cartoken = await CarToken.deployed();
		const purchaseAddr = await carchain.getMyPendingPurchase({from: accounts[6]});
		const myPurchase = await CarPurchase.at(purchaseAddr);
		await myPurchase.uploadDocuments(accounts[1], "testcid1", {from:accounts[6]});
		await myPurchase.uploadDocuments(accounts[2], "testcid2", {from:accounts[6]});
		await myPurchase.uploadDocuments(accounts[3], "testcid3", {from:accounts[6]});
		await myPurchase.uploadDocuments(accounts[4], "testcid4", {from:accounts[6]});
		assert.equal(1, (await myPurchase.getState()).words[0], "State did not transition after document upload!");
	});
	it("Should allow each party to view their own documents ", async () => {
		const carchain = await CarChain.deployed();
		const cartoken = await CarToken.deployed();
		const purchaseAddr = await carchain.getPendingPurchase(accounts[6], {from: accounts[1]});
		const myPurchase = await CarPurchase.at(purchaseAddr);
		assert.equal("testcid1", (await myPurchase.getMyDocuments({from:accounts[1]})), "Dealer received wrong document!");
		assert.equal("testcid2", (await myPurchase.getMyDocuments({from:accounts[2]})), "Dealer received wrong document!");
		assert.equal("testcid3", (await myPurchase.getMyDocuments({from:accounts[3]})), "Dealer received wrong document!");
		assert.equal("testcid4", (await myPurchase.getMyDocuments({from:accounts[4]})), "Dealer received wrong document!");
	});
});