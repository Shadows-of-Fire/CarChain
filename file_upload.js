const EthCrypto = require("eth-crypto");
const createClient = require('ipfs-http-client')
const { CID } = require('ipfs-http-client')
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})
const fs = require('fs')

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
	console.log(bytes.join(', '));
    return bytes;
}

async function upload(client, data, targetAddr){
	//TODO: Validate targetAddr is a real address.
	//const encrypted = await EthCrypto.encryptWithPublicKey(hexToBytes(targetAddr), data);
	const encrypted = await EthCrypto.encryptWithPublicKey(EthCrypto.publicKeyByPrivateKey(targetAddr), data);
	const str = EthCrypto.cipher.stringify(encrypted);
	const { cid } = await client.add(str);
	//Spit out the CID for the document -- TODO: This will be passed to the smart contract.
	console.log("Your document has been uploaded.  Its CID is " + cid.toString());
}

async function run() {
	//Open IPFS connection to local IPFS node on port 5002
	const client = createClient('http://127.0.0.1:5002');
 
    readline.question('What file do you want to upload? ', (filename) => {
		try {
			const data = fs.readFileSync(filename, 'utf8')
			readline.question('Who is the target for this file? ', (targetAddr) => {
				upload(client, data, targetAddr);
				readline.close();
			});
		} catch (err) {
			console.error(err)
		}
	});
}



run();