import React, { Component } from 'react'
import Web3 from 'web3'
import './App.css';
import CarChain from '../abis/CarChain.json'
import CarPurchase from '../abis/CarPurchase.json'
const ECCrypto = require("eccrypto");
const EthCrypto = require("eth-crypto");
const createClient = require('ipfs-http-client');

class Seller extends Component {
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

            //get CarPurchase contract address and deploy it using web3
            var purAddr = await this.state.chainContract.methods.getMyPendingPurchase().call({from:this.state.buyer})
            if(purAddr){
                const abi3 = CarPurchase.abi
                const purchase = new web3.eth.Contract(abi3, purAddr)
                this.setState({purchaseContract: purchase})
                this.setState({states: await purchase.methods.getState().call()})
            }
        }
        else {
            window.alert('Smart contract not deployed to detected network.')
        }
    }

    constructor(props) {
        super(props)

        this.state = {
            account:'',
            buyer: '0xC786EbF555B8B9626E8C0C44940ea1869feB1BD7',
            chainAddr: '',

            states: '',
            chainContract: null,
            purchaseContract: null,

            cid: '',
            pKey: '',
            fName: '',
            decrypted: ''
        }
    }

    //Copyright eth-crypto : https://github.com/pubkey/eth-crypto/blob/master/LICENSE
    //From eth-crypto/util.js
    removeLeading0x = (str) => {
        if (str.startsWith('0x'))
            return str.substring(2);
        else return str;
    }

    //Copyright eth-crypto : https://github.com/pubkey/eth-crypto/blob/master/LICENSE
    //From eth-crypto/decrypt-with-private-key.js, modified to not return buffer.toString()
    decryptWithPrivateKey = (privateKey, encrypted)=>{

        encrypted = EthCrypto.cipher.parse(encrypted);

        // remove trailing '0x' from privateKey
        const twoStripped = this.removeLeading0x(privateKey);

        const encryptedBuffer = {
            iv: Buffer.from(encrypted.iv, 'hex'),
            ephemPublicKey: Buffer.from(encrypted.ephemPublicKey, 'hex'),
            ciphertext: Buffer.from(encrypted.ciphertext, 'hex'),
            mac: Buffer.from(encrypted.mac, 'hex')
        };


        return ECCrypto.decrypt(
            Buffer.from(twoStripped, 'hex'),
            encryptedBuffer
        ).then(decryptedBuffer => decryptedBuffer);
    }

    downloading = (filename, text) =>{
        var blob = new Blob([text], {type: "text/plain"});
        var url = window.URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
    }

    download = async(client, cid, pKey, fName)=>{
        var received = "";

        for await (const chunk of client.cat(cid)) {
            var ret = new TextDecoder().decode(chunk); 
            received += ret;
        }
        const decrypted = await this.decryptWithPrivateKey(
            pKey,
            received
        );
        this.setState({
            decrypted: decrypted
        })
        this.downloading(fName,decrypted)
    }

    run = async() => {
        const client = createClient({host: 'ipfs.infura.io', port: 5001, protocol: 'https'});
        try {
            this.download(client, this.state.cid, this.state.pKey, this.state.fName);
        } catch (err) {
            console.error(err)
        }
    }

    cidhandler = (event) => {
        this.setState({
            cid: event.target.value
        })
    }
    pkeyhandler = (event) => {
        this.setState({
            pKey: event.target.value
        })
    }
    fnamehandler = (event) => {
        this.setState({
            fName: event.target.value
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

    dealerInput = async (approve) => {
        await this.state.purchaseContract.methods.dealerInput(approve).send({from:this.state.account})
    }

    getCID = async () => {
        var temp = await this.state.purchaseContract.methods.getMyDocuments().call({from:this.state.account})
        window.alert(temp)
    }
   
    render() {
        return (
            <div
                style={{
                display: "flex",
                alignItems:'center',
                justifyContent: "center",
                backgroundColor: 'black'
                }} className='Dealer-background'
            >
                <div style={{fontWeight:'bold', color:'rgba(255, 255, 255)', backgroundColor: 'rgba(0, 0, 0, 0.6 )'}}>
                    <h1 style={{
                            display: "flex",
                            alignItems:'center',
                            justifyContent: "center",
                        }}className='form-h1'>Review Documents</h1>
                    <label id="formLabel">CID :</label> <input id="formInput" type="text" value={this.state.cid} onChange={this.cidhandler} placeholder="CID..." /><br/>
                    <form onSubmit={(event)=>{
                        event.preventDefault()
                        this.getCID()
                        }}>    
                        <input id="formButton" type="submit" value="Get CID"/>
                    </form>
                    <label id="formLabel">Private Key :</label> <input id="formInput"  type="text" value={this.state.pKey} onChange={this.pkeyhandler} placeholder="Private Key..." /><br />
                    <label id="formLabel">File Name :</label> <input id="formInput"  type="text" value={this.state.fName} onChange={this.fnamehandler} placeholder="File Name..." /><br />
                    <form onSubmit={(event)=>{
                        event.preventDefault()
                        this.run()
                        }}>    
                        <input id="formButton" type="submit" value="Get File"/>
                    </form>
                    <form onSubmit={(event)=>{
                        event.preventDefault()
                        this.dealerInput(1)
                        }}>
                    <input id="formButton" type="submit" value="Approve" />
                    </form>
                    <form onSubmit={(event)=>{
                        event.preventDefault()
                        this.dealerInput(0)
                        }}>
                    <input id="formButton" type="submit" value="Disapprove" />
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
                </div>
            </div>
            
        );
    }
}

export default Seller