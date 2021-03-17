const artifacts = require('./build/contracts/CarChain.json')
const contract = require('@truffle/contract')
const CarChain = contract(artifacts);
CarChain.setProvider(web3.currentProvider);

CarChain.deployed()
.then(function(instance) {
  console.log(instance.address)
})
.catch(function(error) {
  console.error(error)
})