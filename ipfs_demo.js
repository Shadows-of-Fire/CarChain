const EthCrypto = require("eth-crypto");
const createClient = require('ipfs-http-client')
const { CID } = require('ipfs-http-client')

async function run() {
	// Open IPFS connection to local IPFS node on port 5002
	const client = createClient('http://127.0.0.1:5002');
 
    // Dummy key pulled from Ganache -- TODO: Use current logged-in user's PK
    const priv = "7ba3178b4f8846b9946b129876869319de89ef4032f7a9271122380478fca64c";

	const secretMessage = "Encrypted test content posted to a local IPFS";
	const encrypted = await EthCrypto.encryptWithPublicKey(
		EthCrypto.publicKeyByPrivateKey(priv), // encrypt with alice's publicKey
		secretMessage
	);
	const str = EthCrypto.cipher.stringify(encrypted);
  
    console.log(encrypted);
  
	//Await document posted to IPFS node
	const { cid } = await client.add(str);	
	
	//Spit out the CID for the document -- TODO: This will be passed to the smart contract.
    console.log(cid.toString());

	var retrieved;

	for await (const chunk of client.cat(cid)) {
		var received = new TextDecoder().decode(chunk); 
		retrieved = received;
		break;
	}

	//retrieved = retrieved.replace("8", "2");

	const parsed = EthCrypto.cipher.parse(retrieved);
	
	const decrypted = await EthCrypto.decryptWithPrivateKey(
		priv,
		parsed
	);

	console.log(decrypted);
	
}



run();