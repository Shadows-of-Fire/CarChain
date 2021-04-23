import React, { Component } from 'react';
import Web3 from 'web3'
import './App.css';
import CarToken from '../abis/CarToken.json'
import CarChain from '../abis/CarChain.json'
import randomColor from "randomcolor";

class Manufacturer extends Component {

  async componentWillMount() {
    await this.loadWeb3()
    await this.loadBlockchainData()
  }

  async loadWeb3() {
      if (window.ethereum) {
          window.web3 = new Web3(window.ethereum)
          await window.ethereum.enable()
      }
      else if (window.web3) {
          window.web3 = new Web3(window.web3.currentProvider)
      }
      else {
          window.alert('Non-Ethereum browser detected. You should consider trying MetaMask!')
      }
  }

  //Load the NFT CarToken Smart Contract
  async loadBlockchainData() {
    const web3 = window.web3
    //Load account
    const accounts = await web3.eth.getAccounts()
    this.setState({account: accounts[0]})
    const networkId = await web3.eth.net.getId()
    const networkData = CarChain.networks[networkId]
    const networkData2 = CarToken.networks[networkId]
    if(networkData && networkData2){
      const abi = CarChain.abi
      const address = networkData.address
      const chain = new web3.eth.Contract(abi, address)
      this.setState({chainContract: chain})

      const abi2 = CarToken.abi
      const address2 = networkData2.address
      const token = new web3.eth.Contract(abi2, address2)
      this.setState({tokenContract: token})


      var temp = await chain.methods.getDealer().call();
      this.setState({dealer: temp})
      temp = await token.methods.getManufacturer().call();
      this.setState({manufacturer: temp})
      
      const totalSupply = await token.methods.balanceOf(this.state.dealer).call()
      this.setState({totalSupply})
      //get all the cars stored in there
      for (var i = 1; i <= totalSupply; i++) {
        const car = await token.methods.tokenOfOwnerByIndex(this.state.dealer,i - 1).call()
        this.setState({
          cars: [...this.state.cars, car.toString()]
        })
      }
    }
    else {
      window.alert('Smart contract not deployed to detected network.')
    }
  }

  addCar = async(car) => {
    console.log(car)
    await this.state.tokenContract.methods.newCar(this.state.dealer, car).send({from:this.state.account})
    .once('receipt',(receipt)=>{
      this.setState({
        cars:[...this.state.cars, car.toString()]
      })
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      account: '',
      manufacturer: '',
      dealer: '',
      tokenContract: null,
      chainContract: null,
      totalSupply: 0,
      cars: [],
      bgColor: ''
    }
  }

  render() {
    let color = randomColor();
    return (
      <div className="Manufacturer-background">
        <div className="container-fluid mt-5">
          <div className="content mr-auto ml-auto"></div>
          <div className="row text-center">
            { this.state.cars.map((car, key) => {
              return (<div key={key} className="col-md-3 mb-3">
                <div class="token" style={{backgroundColor: color}}></div>
                <div>{car}</div>
                </div>
              )
            })}
          </div>
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto" style={{fontWeight:'italic', color:'rgb(57, 34, 185)', backgroundColor: 'rgba(255, 255, 255, 0.6 )'}}>                
                <h1>Add New Car</h1>
                <form onSubmit={(event)=>{
                  event.preventDefault()
                  const car = this.car.value
                  this.addCar(car)
                  color = randomColor();
                }}>
                  <input
                    type = 'text'
                    pattern= '[0-9]*'
                    maxLength = "17"
                    minLength = "17"
                    className ='form-control mb-1'
                    placeholder='Enter VIN #'
                    ref={(input) => {
                      this.car = input
                    }}
                  />
                  <input
                    type='submit'
                    className='btn btn-block btn-primary'
                    value='Send To Dealer'
                  />
                </form>
              </div>
            </main>
          </div>
          <hr/>
          
        </div>
      </div>
    );
  }
}

export default Manufacturer;
