// migrations/2_deploy.js
const CarToken = artifacts.require("CarToken");
const CarChain = artifacts.require("CarChain");

module.exports = async function (deployer) {
  deployer.deploy(CarToken).then(function() {
	  return deployer.deploy(CarChain, CarToken.address);
  }).then(function() {});
};