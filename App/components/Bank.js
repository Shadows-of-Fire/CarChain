import React, { Component } from 'react'
import Web3 from 'web3'
import './App.css';
import CarChain from '../abis/CarChain.json'
import CarPurchase from '../abis/CarPurchase.json'
const ECCrypto = require("eccrypto");
const EthCrypto = require("eth-crypto");
const createClient = require('ipfs-http-client');

class Bank extends Component {
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
            buyer: '0xb4C78Ae1848AA5Fc75bb684E36791d4123348afa',

            states: '',
            chainContract: null,
            purchaseContract: null,

            cid: '',
            pKey: '',
            fName: '',
            decrypted: '',
            publicKey: this.removeLeading0x(EthCrypto.hex.decompress('uCeYa2znDlEanGgpsEGD1wt6q7Ij+Gwm/122ii9dPWcI1UDZtwg/TFgp3V892XuvWCqRwuKdsRlAcL77ES6biw==',true)),

            getCid: ''
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
        const encrypted = await EthCrypto.encryptWithPublicKey(targetAddr, data);
        const str = EthCrypto.cipher.stringify(encrypted);
        const {cid} = await client.add(str);
        this.setState({cid: cid.toString()})
        //Spit out the CID for the document
        window.alert("Your document has been uploaded.  Its CID is " + cid.toString());
    }
    
    run = async() => {
        //Open IPFS connection to local IPFS node
        const client = createClient({host: 'ipfs.infura.io', port: 5001, protocol: 'https'});
        try {
            await this.upload(client, this.state.buffer, this.state.publicKey);

            //if the user already uploaded send it to the target
            if(this.state.cid){
                await this.state.purchaseContract.methods.uploadLoanTerms(this.state.buyer,this.state.cid).send({from:this.state.account})
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

    getFile = async() => {
        const client = createClient({host: 'ipfs.infura.io', port: 5001, protocol: 'https'});
        try {
            this.download(client, this.state.getCid, this.state.pKey, this.state.fName);
        } catch (err) {
            console.error(err)
        }
    }

    cidhandler = (event) => {
        this.setState({
            getCid: event.target.value
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
    publichandler = (event) => {
        this.setState({
            publicKey: event.target.value
        })
    }

    setStyle = (pending,done,deny) =>{
        let styles = {}
        if (this.state.states === pending){
            styles = 'rectanglePending'
        }
        else if (this.state.states === deny){
            styles = 'rectangleDeny'
        }
        else if (this.state.states >= done){
            styles = 'rectangleDone'
        }
        else{
            styles = 'rectangleDefault'
        }
        return styles.toString()
    }

    getCID = async () => {
        var temp = await this.state.purchaseContract.methods.getMyDocuments().call({from:this.state.account})
        window.alert(temp)
    }

    decline = async ()=> {
        await this.state.purchaseContract.methods.bankInput(0).send({from:this.state.account})
    }
   
    render() {
        return (
            <div
                style={{
                display: "flex",
                alignItems:'center',
                justifyContent: "center",
                backgroundColor: 'black'
                }} className='Bank-background'
            >
                <div style={{fontWeight:'bold', color:'rgba(255, 255, 255)', backgroundColor: 'rgba(0, 0, 0, 0.6 )'}}>
                    <h1 style={{
                            display: "flex",
                            alignItems:'center',
                            justifyContent: "center",
                        }}className='form-h1'>Review Documents</h1>
                    <label id="formLabel">CID :</label> <input id="formInput" type="text" value={this.state.getCid} onChange={this.cidhandler} placeholder="CID..." />
                    <form onSubmit={(event)=>{
                        event.preventDefault()
                        this.getCID()
                        }}>    
                        <input id="formButton" type="submit" value="Get CID"/>
                    </form><br/>
                    <label id="formLabel">Private Key :</label> <input id="formInput"  type="text" value={this.state.pKey} onChange={this.pkeyhandler} placeholder="Private Key..." /><br />
                    <label id="formLabel">File Name :</label> <input id="formInput"  type="text" value={this.state.fName} onChange={this.fnamehandler} placeholder="File Name..." /><br />
                    <form onSubmit={(event)=>{
                        event.preventDefault()
                        this.getFile()
                        }}>    
                        <input id="formButton" type="submit" value="Get File"/>
                    </form><br/>
                    <form onSubmit={(event)=>{
                        event.preventDefault()
                        this.decline()
                        }}>    
                        <input id="formButton" type="submit" value="Decline"/>
                    </form>

                    <h1 className='form-h1'>Upload Loan Documents to Buyer</h1>
                        <form onSubmit={this.onSubmit}>
                            <label id="formLabel">Documents :</label> 
                            <input type="file" onChange={this.captureFile}/><br/>
                            <input id='formButton' type="submit" value="Upload"/>
                        </form>

                    <h1 className='form-h1'>Status </h1>             
                    <div className={this.setStyle(0,1,-2)}>
                        <p className="text">Start</p>
                    </div>
                    <div className={this.setStyle(1,2,3)}>
                        <p className="text">Bank</p>
                    </div>
                    <div className={this.setStyle(2,4,10)}>
                        <p className="text">Loan</p>
                    </div>
                    <div className={this.setStyle(4,6,5)}>
                        <p className="text">Insurance</p>
                    </div>
                    <div className={this.setStyle(6,8,7)}>
                        <p className="text">State</p>
                    </div>
                    <div className={this.setStyle(8,9,-2)}>
                        <p className="text">Dealer</p>
                    </div><br/>
                </div>
            </div>
        );
    }
}

export default Bank