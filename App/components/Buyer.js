import React, { Component } from 'react'
import Web3 from 'web3'
import './App.css';
import CarChain from '../abis/CarChain.json'
import CarPurchase from '../abis/CarPurchase.json'
const EthCrypto = require("eth-crypto");
const createClient = require('ipfs-http-client')

class Buyer extends Component {
    getCid = () =>{
        return this.state.cid;
    }

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
        if(networkData){
            const abi = CarChain.abi
            const address = networkData.address
            const chain = new web3.eth.Contract(abi, address)
            this.setState({chainContract: chain})

            //get all the clients
            var temp = await chain.methods.getDealer().call();
            this.setState({dealer: temp})
            temp = await chain.methods.getBank().call();
            this.setState({bank: temp})
            temp = await chain.methods.getState().call();
            this.setState({gov: temp})
            temp = await chain.methods.getInsurance().call();
            this.setState({insurance: temp})

            //get CarPurchase contract address and deploy it using web3
            var purAddr = await this.state.chainContract.methods.getMyPendingPurchase().call({from:this.state.buyer})
            if(purAddr){
                const abi3 = CarPurchase.abi
                const purchase = new web3.eth.Contract(abi3, purAddr)
                this.setState({purchaseContract: purchase})
                console.log(await purchase.methods.getState().call())
                this.setState({states: await purchase.methods.getState().call()})
            }
        }
        else {
            window.alert('Smart contract not deployed to detected network.')
        }
    }
    
    startPurchase = async(car) =>{
        await this.state.chainContract.methods.startPurchase(car).send({from:this.state.account})
    }
    
    constructor(props) {
        super(props)

        this.state = {
            account: '',
            firstName: "",
            lastName: "",
            address: "",
            insurancePolicy: "",
            bankAccount: "",
            routing: "",
            vin: "",
            
            buffer: null,
            publicKey: '',
            targetAddress: '',
            output:'',

            buyer: '0xC786EbF555B8B9626E8C0C44940ea1869feB1BD7',
            dealer: '',
            bank: '',
            gov: '',
            insurance: '',

            chainContract: null,
            purchaseContract: null,
            purchaseAddr: '',
            states: -1,
            cid: ''
        }
    }

    captureFile = (event) => {
        event.preventDefault()
        const file = event.target.files[0]
        const reader = new window.FileReader()
        reader.readAsArrayBuffer(file)
        reader.onloadend = () => {
          this.setState({ buffer: Buffer(reader.result) })
          console.log('buffer', this.state.buffer)
        }
    }
    
    upload = async(client, data, targetAddr) =>{
        const encrypted = await EthCrypto.encryptWithPublicKey(EthCrypto.publicKeyByPrivateKey(targetAddr), data);
        const str = EthCrypto.cipher.stringify(encrypted);
        const {cid} = await client.add(str);
        this.setState({cid: cid.toString()})
        //Spit out the CID for the document -- TODO: This will be passed to the smart contract.
        window.alert("Your document has been uploaded.  Its CID is " + cid.toString());
    }
    
    run = async() => {
        //Open IPFS connection to local IPFS node
        const client = createClient({host: 'ipfs.infura.io', port: 5001, protocol: 'https'});
        try {
            this.upload(client, this.state.buffer, this.state.publicKey);

            //if the user already uploaded send it to the target
            if(this.state.cid){
                await this.state.purchaseContract.methods.uploadDocuments(this.state.targetAddress,this.state.cid).send({from:this.state.account})
                console.log(await this.state.purchaseContract.methods.getState().call())
            }
        } catch (err) {
            console.error(err)
        }
    }

    stop = async() => {
        await this.state.purchaseContract.methods.abort().send({from:this.state.account})
    }

    onSubmit = (event) => {
        event.preventDefault()
        this.run()
    }

    firsthandler = (event) => {
        this.setState({
            firstName: event.target.value
        })
    }
    lasthandler = (event) => {
        this.setState({
            lastName: event.target.value
        })
    }
    addresshandler = (event) => {
        this.setState({
            address: event.target.value
        })
    }
    insurancehandler = (event) => {
        this.setState({
            insurance: event.target.value
        })
    }
    bankAccounthandler = (event) => {
        this.setState({
            bankAccount: event.target.value
        })
    }
    routinghandler = (event) => {
        this.setState({
            routing: event.target.value
        })
    }
    vinhandler = (event) => {
        this.setState({
            vin: event.target.value
        })
    }
    publichandler = (event) => {
        this.setState({
            publicKey: event.target.value
        })
    }
    targetaddresshandler = (event) => {
        this.setState({
            targetAddress: event.target.value
        })
    }

    setStyle = (pending,done,deny) =>{
        let styles = {}
        if (this.state.states === pending){
            styles = 'rectanglePending'
        }
        else if (this.state.states === deny){
            styles = 'rectangeDeny'
        }
        else if (this.state.states >= done){
            styles = 'rectangleDone'
        }
        else{
            styles = 'rectangleDefault'
        }
        return styles.toString()
    }

    download = (filename, text) =>{
        var blob = new Blob([text], {type: "text/plain"});
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
    }

    makeOutput = () =>{
        const str = 'First Name: ' + this.state.firstName + '\nLast Name: ' + this.state.lastName + '\nAddress: ' + this.state.address +
                    '\nInsurancy Policy Number: ' + this.state.insurancePolicy + '\nBank Account Number: ' + this.state.bankAccount +
                    '\nRouting Number: ' + this.state.routing + '\nVIN Number: ' + this.state.vin  
        this.download('input.txt', str);
    }

    render() {
        return (
            <div
                style={{
                display: "flex",
                alignItems:'center',
                justifyContent: "center",
                backgroundColor: 'black'
                }} className='Cars-background'
            >
                <div style={{fontWeight:'bold', color:'rgba(255, 255, 255)', backgroundColor: 'rgba(0, 0, 0, 0.6 )'}}>
                    <form>
                        <h1 style={{
                            display: "flex",
                            alignItems:'center',
                            justifyContent: "center",
                        }}className='form-h1'>Purchasing Contract</h1>
                        <label id="formLabel">First Name :</label> <input id="formInput" type="text" value={this.state.firstName} onChange={this.firsthandler} placeholder="First Name..." />
                        <label id="formLabel">Last Name :</label> <input id="formInput"  type="text" value={this.state.lastName} onChange={this.lasthandler} placeholder="Last Name..." /><br />
                        <label id="formLabel">Address :</label> <input id="formInput"  type="text" value={this.state.address} onChange={this.addresshandler} placeholder="Address..." />
                        <label id="formLabel">Insurance Policy # :</label> <input id="formInput"  type="text" value={this.state.insurancePolicy} onChange={this.insurancehandler} placeholder="Insurance Policy #..." /><br />
                        <label id="formLabel">Bank Account # :</label> <input id="formInput"  type="text" value={this.state.bankAccount} onChange={this.bankAccounthandler} placeholder="Bank Account #..." />
                        <label id="formLabel">Routing # :</label> <input id="formInput"  type="text" value={this.state.routing} onChange={this.routinghandler} placeholder="Routing Number..." /><br />
                        <form onSubmit={(event)=>{
                                event.preventDefault()
                                this.startPurchase(this.state.vin)
                                }}>
                            <label id="formLabel">VIN # :</label> <input id="formInput"  type="text" value={this.state.vin} onChange={this.vinhandler} placeholder="VIN Number..." />
                            <input type="submit" value="Check VIN Number/Start Buying Process "/>
                        </form>
                
                        
                        <h1 className='form-h1'>Upload Documents</h1>
                        <form onSubmit={this.onSubmit}>
                            <label id="formLabel">Documents :</label> 
                            <input type="file" onChange={this.captureFile}/><br/>
                            <label id="formLabel">Target Private Key:</label> <input id="formInput"  type="text" value={this.state.publicKey} onChange={this.publichandler} placeholder="Public Key..." />
                            <label id="formLabel">Target Address:</label> <input id="formInput"  type="text" value={this.state.targetAddress} onChange={this.addresshandler} placeholder="Address..." /><br/>
                            <input id='formButton' type="submit" value="Upload"/>
                        </form>

                        <h1 className='form-h1'>Status </h1>              
                        <div className={this.setStyle(0,1,-2)}>
                            <p className="text">Start</p>
                        </div>
                        <div className={this.setStyle(1,3,2)}>
                            <p className="text">Bank</p>
                        </div>
                        <div className={this.setStyle(3,5,4)}>
                            <p className="text">Insurance</p>
                        </div>
                        <div className={this.setStyle(5,7,6)}>
                            <p className="text">State</p>
                        </div>
                        <div className={this.setStyle(7,8,-2)}>
                            <p className="text">Dealer</p>
                        </div>
                        <div className={this.setStyle(8,100,9)}>
                            <p className="text">Complete</p>
                        </div><br/>
                        <form onSubmit={(event)=>{
                            event.preventDefault()
                            this.makeOutput()
                        }}>
                                <input id='formButton' type="submit" value="Done"/>
                        </form>
                        <form onSubmit={(event)=>{
                            event.preventDefault()
                            this.stop()
                        }}>
                                <input id='formButton' type="submit" value="Stop the Purchase"/>
                        </form>
                    
                    </form>
                </div>
            </div>          
        );
    }
}

export default Buyer