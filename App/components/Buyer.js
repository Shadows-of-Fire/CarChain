import React, { Component } from 'react'
import Web3 from 'web3'
import './App.css';
import CarChain from '../abis/CarChain.json'
import CarPurchase from '../abis/CarPurchase.json'
const ECCrypto = require("eccrypto");
const EthCrypto = require("eth-crypto");
const createClient = require('ipfs-http-client')

class Buyer extends Component {
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
            if(this.state.buyer)
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

            buyer: '0xb4C78Ae1848AA5Fc75bb684E36791d4123348afa',
            bank: this.removeLeading0x(EthCrypto.hex.decompress('UvA7/b+KLuZxmAxYV0NuFfOhmMsyW+xxe2aSdgq5DrP1fmZ9m+CJbMoctiTlhwXAdoAe1umeFCTgZEO5Za/jPQ==',true)),
            insurance: this.removeLeading0x(EthCrypto.hex.decompress('gYrUSEauTtQRLrsRQaSCyK8u5q6FTdNt6wQ+56RSJco2m/WK3+Mh814cC1Rcm70odYKIVuY0VjNI/ckxpnTWgA==',true)),
            gov: this.removeLeading0x(EthCrypto.hex.decompress('RDP/nXqv6b3zTASO7+5qTr1U5d1IbKG0Wnv02UvD9bKl+xV0DDLUtkbyWL4lghe2BUwKe9dv+j8trmW4uYv7Kg==',true)),
            dealer: this.removeLeading0x(EthCrypto.hex.decompress('FerZQtes8EzS6Bxj2v/L6ynyJ7G0PhqNg0+5mS1VkEfa/OE9znwzpp32PLzk1Ey54wJ0R+z67W+hmn3I2VMc3Q==',true)),  
            publicKey: this.removeLeading0x(EthCrypto.hex.decompress('uCeYa2znDlEanGgpsEGD1wt6q7Ij+Gwm/122ii9dPWcI1UDZtwg/TFgp3V892XuvWCqRwuKdsRlAcL77ES6biw==',true)),

            chainContract: null,
            purchaseContract: null,
            purchaseAddr: '',
            states: -1,
            cid: '',

            getCid: '',
            fName: 'Loan',
            privateKey: ''
        }
    }

    //get the current file selected
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
            this.makeOutput();
            await this.upload(client, this.state.buffer, this.state.publicKey);
            //if the user already uploaded send it to the target
            if(this.state.cid){
                await this.state.purchaseContract.methods.uploadDocuments(EthCrypto.publicKey.toAddress(this.state.publicKey),this.state.cid).send({from:this.state.account})
                console.log(await this.state.purchaseContract.methods.getState().call())
            }
            this.setState({buffer: ''})
        } catch (err) {
            console.error(err)
        }
    }


    //when in declined state, you can reupload
    reUpload = async() => {
        const client = createClient({host: 'ipfs.infura.io', port: 5001, protocol: 'https'});
        this.makeOutput();
        try{
            if(this.state.states === 3){
                await this.upload(client, this.state.buffer, this.state.bank);
                await this.state.purchaseContract.methods.reuploadBank(this.state.cid).send({from:this.state.account});
            }
            else if(this.state.states === 5){
                await this.upload(client, this.state.buffer, this.state.insurance);
                await this.state.purchaseContract.methods.reuploadInsn(this.state.cid).send({from:this.state.account});
            }
            else if(this.state.states === 7){
                await this.upload(client, this.state.buffer, this.state.gov);
                await this.state.purchaseContract.methods.reuploadState(this.state.cid).send({from:this.state.account});
            }
            this.setState({buffer: ''})
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

    //All the handlers for the inputs
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
            insurancePolicy: event.target.value
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
    privatekeyhandler = (event) => {
        this.setState({
            privateKey: event.target.value
        })
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

    //Changes the rectangle depending on the States
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

    makeOutput = () =>{
        const str = '\n\n\t\tINFORMATION\n\n'+'First Name: ' + this.state.firstName + '\nLast Name: ' + this.state.lastName + '\nAddress: ' + this.state.address +
                    '\nInsurancy Policy Number: ' + this.state.insurancePolicy + '\nBank Account Number: ' + this.state.bankAccount +
                    '\nRouting Number: ' + this.state.routing
        this.state.buffer += str;
    }

    /******************************************************************************************
     Functions for getting file from the Bank
    ******************************************************************************************/

    getCID = async () => {
        var temp = await this.state.purchaseContract.methods.getMyDocuments().call({from:this.state.account})
        window.alert(temp)
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

    buyerInput = async (approve) => {
        await this.state.purchaseContract.methods.buyerInput(approve).send({from:this.state.account})
    }

    createP = (address) =>{
        const key = EthCrypto.publicKeyByPrivateKey(address);
        var a = EthCrypto.hex.compress(key,true)
        console.log(a)
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
                        <h1 className='form-h1'>Purchasing Contract</h1>
                        <form onSubmit={(event)=>{
                                event.preventDefault()
                                this.startPurchase(this.state.vin)
                                }}>
                            <label id="formLabel">VIN # :</label> <input id="formInput"  type="text" value={this.state.vin} onChange={this.vinhandler} placeholder="VIN Number..." />
                            <input type="submit" value="Check VIN Number/Start Buying Process "/>
                        </form><br/>
                        <h1 className='form-h1'>Fill Information/Upload Documents</h1>
                        <label id="formLabel">First Name :</label> <input id="formInput" type="text" value={this.state.firstName} onChange={this.firsthandler} placeholder="First Name..." />
                        <label id="formLabel">Last Name :</label> <input id="formInput"  type="text" value={this.state.lastName} onChange={this.lasthandler} placeholder="Last Name..." /><br />
                        <label id="formLabel">Address :</label> <input id="formInput"  type="text" value={this.state.address} onChange={this.addresshandler} placeholder="Address..." />
                        <label id="formLabel">Insurance Policy # :</label> <input id="formInput"  type="text" value={this.state.insurancePolicy} onChange={this.insurancehandler} placeholder="Insurance Policy #..." /><br />
                        <label id="formLabel">Bank Account # :</label> <input id="formInput"  type="text" value={this.state.bankAccount} onChange={this.bankAccounthandler} placeholder="Bank Account #..." />
                        <label id="formLabel">Routing # :</label> <input id="formInput"  type="text" value={this.state.routing} onChange={this.routinghandler} placeholder="Routing Number..." /><br />
                        <form onSubmit={this.onSubmit}>
                            <label id="formLabel">Documents :</label> 
                            <input type="file" onChange={this.captureFile}/><br/>
                            <label id="formLabel">
                                Choose Target:
                            </label>       
                            <select value={this.state.publicKey} onChange={this.publichandler}>
                                <option value={this.state.dealer}>Dealer</option>
                                <option value={this.state.bank}>Bank</option>
                                <option value={this.state.insurance}>Insurance</option>
                                <option value={this.state.gov}>State</option>
                            </select>
                            <br/>
                            <input id='formButton' type="submit" value="Upload"/>
                        </form>
                        <form onSubmit={(event)=>{
                            event.preventDefault()
                            this.reUpload()
                        }}>
                            <input id='formButton' type="submit" value="Re-upload"/>    
                        </form>
                        <h1 className='form-h1'>Accept or Decline Bank Loan Term</h1>
                        <label id="formLabel">CID :</label> <input id="formInput" type="text" value={this.state.getCid} onChange={this.cidhandler} placeholder="CID..." />
                        <form onSubmit={(event)=>{
                            event.preventDefault()
                            this.getCID()
                            }}>    
                            <input id="formButton" type="submit" value="Get CID"/>
                        </form> <br/>
                        <label id="formLabel">Private Key :</label> <input id="formInput"  type="text" value={this.state.pKey} onChange={this.pkeyhandler} placeholder="Private Key..." />
                        <form onSubmit={(event)=>{
                            event.preventDefault()
                            this.getFile()
                            }}>    
                            <input id="formButton" type="submit" value="Get File"/>
                        </form><br/>
                        <form onSubmit={(event)=>{
                            event.preventDefault()
                            this.buyerInput(1)
                        }}>
                            <input id="formButton" type="submit" value="Approve" />
                        </form>
                        <form onSubmit={(event)=>{
                            event.preventDefault()
                            this.buyerInput(0)
                            }}>
                        <input id="formButton" type="submit" value="Disapprove" />
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
                        <form onSubmit={(event)=>{
                            event.preventDefault()
                            this.stop()
                        }}>
                            <input id='formButton' type="submit" value="Stop the Purchase"/>    
                        </form><br/>     
                    </form>
                </div>
            </div>          
        );
    }
}
/*
<label id="formLabel">Private Key :</label> <input id="formInput"  type="text" value={this.state.privateKey} onChange={this.privatekeyhandler} placeholder="Private Key..." />
                        <form onSubmit={(event)=>{
                            event.preventDefault()
                            this.createP(this.state.privateKey)
                            }}>    
                            <input id="formButton" type="submit" value="Get PrivateKey"/>
                        </form><br/>    
*/
export default Buyer