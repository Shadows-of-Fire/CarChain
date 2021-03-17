const EthCrypto = require("eth-crypto");
const createClient = require('ipfs-http-client')
const { CID } = require('ipfs-http-client')
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

async function download(client, cid, pKey){
	var retrieved;

	for await (const chunk of client.cat(cid)) {
		var received = new TextDecoder().decode(chunk); 
		retrieved = received;
		break;
	}
	
	const parsed = EthCrypto.cipher.parse(retrieved);
	
	const decrypted = await EthCrypto.decryptWithPrivateKey(
		pKey,
		parsed
	);

	console.log(decrypted);
}

async function run() {
	//Open IPFS connection to local IPFS node on port 5002
	const client = createClient('http://127.0.0.1:5002');
 
    readline.question('What file do you want to access? ', (cid) => {
		try {
			readline.question('What private key should decrypt this file? ', (pKey) => {
				download(client, cid, pKey);
				readline.close();
			});
		} catch (err) {
			console.error(err)
		}
	});
}



run();