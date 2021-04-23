import React, { Component } from 'react';
import Web3 from 'web3'
import './App.css';
import CarChain from '../abis/CarChain.json'
import CarToken from '../abis/CarToken.json'
import Background from './image/road.jpg'

class Home extends Component {
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

    async loadBlockchainData() {
        const web3 = window.web3
        //Load account
        const accounts = await web3.eth.requestAccounts()
        this.setState({account: accounts[0]})
        const networkId = await web3.eth.net.getId()
        const networkData = CarChain.networks[networkId]
        const networkData2 = CarToken.networks[networkId]
        if(networkData && networkData2){
            const abi = CarChain.abi
            const address = networkData.address
            const chainContract = new web3.eth.Contract(abi, address)
            this.setState({chainContract})

            const abi2 = CarToken.abi
            const address2 = networkData2.address
            const tokenContract = new web3.eth.Contract(abi2, address2)
            this.setState({tokenContract})

            var temp = await chainContract.methods.getDealer().call();
            this.setState({dealer: temp})
            temp = await tokenContract.methods.getManufacturer().call();
            this.setState({manufacturer: temp})
            temp = await tokenContract.methods.getCarChain().call();
            this.setState({carchain: temp})
            temp = await chainContract.methods.getBank().call();
            this.setState({bank: temp})
            temp = await chainContract.methods.getState().call();
            this.setState({states: temp})
            temp = await chainContract.methods.getInsurance().call();
            this.setState({insurance: temp})
        }
        else {
            window.alert('Smart contract not deployed to detected network.')
        }
    }

    constructor(props) {
        super(props)
        this.state = {
          account: '',
          manufacturer: '',
          dealer: '',
          bank: '',
          states: '',
          insurance: '',
          carchain: ''
        }
      }

    render(){
        return(
            <div
                style={{
                display: "flex",
                backgroundColor: 'black',
                }} className='Home-background' 
            >
                <div className="container-fluid mt-5">
                    <div className="row">
                        <main role="main" className="col-lg-12 d-flex text-center">
                            <div className="content mr-auto ml-auto" style={{fontWeight:'bold', color:'#000000', backgroundColor: 'rgba(255, 255, 255, 0.6 )'}}>
                                <h1>Welcome</h1>
                                <p>Your Account: {this.state.account}</p>
                                <p>Manufacturer: {this.state.manufacturer}</p>
                                <p>Bank: {this.state.bank}</p>
                                <p>Insurance: {this.state.insurance}</p>
                                <p>State: {this.state.states}</p>
                                <p>Dealer: {this.state.dealer}</p>
                                <p>Contract: {this.state.carchain}</p>
                                <p>This is an front-end for a USF Senior Project about creating a Smart Contract system for car sales. </p>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        );
    }
}

export default Home;