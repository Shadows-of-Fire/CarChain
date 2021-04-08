const CarChain = artifacts.require("CarChain");
const CarToken = artifacts.require("CarToken");

contract("New Car Tests", async accounts => {
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
	it("Should allow the manufacturer to generate cars", async () => {
		const cartoken = await CarToken.deployed();
		await cartoken.newCar(accounts[1], 200, {from: accounts[0]});
		await cartoken.newCar(accounts[1], 256, {from: accounts[0]});
		await cartoken.newCar(accounts[1], 512, {from: accounts[0]});
	});
	it("Should allow the dealer's cars to be viewed", async () => {
		const carchain = await CarChain.deployed();
		const cars = await carchain.getDealerCars({from: accounts[6]});
		assert.equal(cars[0].words[0], 200, "First car was not visible!");
		assert.equal(cars[1].words[0], 256, "Second car was not visible!");
		assert.equal(cars[2].words[0], 512, "Third car was not visible!");
	});
});