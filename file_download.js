const ECCrypto = require("eccrypto");
const EthCrypto = require("eth-crypto");
const createClient = require('ipfs-http-client')
const { CID } = require('ipfs-http-client')
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})
const fs = require('fs');

//Copyright eth-crypto : https://github.com/pubkey/eth-crypto/blob/master/LICENSE
//From eth-crypto/util.js
function removeLeading0x(str) {
    if (str.startsWith('0x'))
        return str.substring(2);
    else return str;
}

//Copyright eth-crypto : https://github.com/pubkey/eth-crypto/blob/master/LICENSE
//From eth-crypto/decrypt-with-private-key.js, modified to not return buffer.toString()
function decryptWithPrivateKey(privateKey, encrypted) {

    encrypted = EthCrypto.cipher.parse(encrypted);

    // remove trailing '0x' from privateKey
    const twoStripped = removeLeading0x(privateKey);

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

async function download(client, cid, pKey, fName){
	var received = "";

	for await (const chunk of client.cat(cid)) {
		var ret = new TextDecoder().decode(chunk); 
		received += ret;
	}

	const decrypted = await decryptWithPrivateKey(
		pKey,
		received
	);

	//console.log(decrypted);
	fs.writeFileSync(fName, decrypted);
}

async function run() {
	//Open IPFS connection to local IPFS node on port 5002
	const client = createClient('http://127.0.0.1:5002');
 
    readline.question('What file do you want to access? ', (cid) => {
		try {
			readline.question('What private key should decrypt this file? ', (pKey) => {
				readline.question('What should the file be called? ', (fName) => {
					download(client, cid, pKey, fName);
					readline.close();
				});
			});
		} catch (err) {
			console.error(err)
		}
	});
}



run();