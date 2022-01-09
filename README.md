Novel Blockchain Scripts

- [How Our Blockchain Transactions Work](#how-our-blockchain-transactions-work)
- [Setting up Your Environment](#setting-up-your-environment)
	- [Create a MetaMask account](#create-a-metamask-account)
	- [Add the Polygon Networks to MetaMask](#add-the-polygon-networks-to-metamask)
	- [Create Test Wallets in MetaMask.](#create-test-wallets-in-metamask)
	- [Export Private Keys for Wallets](#export-private-keys-for-wallets)
	- [Set Environmental Variables](#set-environmental-variables)
	- [Compile](#compile)
- [Scripts](#scripts)
	- [Deploy Paymaster](#deploy-paymaster)
	- [Verify Paymaster](#verify-paymaster)
	- [Fill Paymaster](#fill-paymaster)

# How Our Blockchain Transactions Work
1. Novel Admin Wallet (owned by Novel) creates a GSN Paymaster, which will fund all transactions
2. Brand Wallet (ex: General Mills) creates and deploys a Collection Contract, using the Paymaster to pay the gas fee
3. Customer Wallet (buying the NFT) will perform a gasless mint function, funded by the Novel Paymaster

# Setting up Your Environment
## Create a MetaMask account

## Add the Polygon Networks to MetaMask
1. Go to [ChainList.org](https://chainlist.org/) and search for "MATIC".
2. Click "Add to MetaMask" on both the MainNet and the TestNet
3. Click "Approve" in your MetaMask Wallet

## Create Test Wallets in MetaMask. 
1. Click MetaMask extension
2. Click on your account image on the very top right
3. Click "Create Account"
4. Name the following accounts:
   	* **Novel Admin Wallet**: will hold MATIC and fund the Paymaster
   	* **Brand Wallet**: this will be owned by the brand (ex: General Mills) in production, but in your test environment, we are going to pretend we are also a brand.
   	* **Customer Wallet**: this will be the Torus wallet automatically created for the NFT Buyer (customer). It will hold no MATIC. We are mocking it in our local setup, by creating a wallet in MetaMask


## Export Private Keys for Wallets
1. Switch to the "Novel Admin Wallet"
2. Click on "..." on top right
3. Click "Account Details"
4. Click "Export Private Key"
5. Enter your password
6. Copy they key to someplace secure to use in next step 
7. Go back to the account, and copy the "Public Address" by clicking the little "Copy" button next to `0x....`
8. Repeat for all 3 wallets 

## Set Environmental Variables
1. Make a copy of `.env.template` into `.env` 
2. Substitute the following values:
 	* `NOVEL_ADMIN_WALLET_PRIVATE_KEY`: Export from MetaMask using steps above
 	* `BRAND_WALLET_PRIVATE_KEY`: Same as above, but for the Brand Wallet"
3. Copy the public keys on the wallets (using steps in previous section)  to:
	* `CUSTOMER_WALLET_PUBLIC_KEY`
	* `NOVEL_ADMIN_WALLET_PUBLIC_KEY`
3. Go to [PolygonScan](https://polygonscan.com/) and create an account. Click on your name for the dropdown, and click API Keys. Copy that key into `ETHERSCAN_API_KEY`

4. Set up your `RPC_MAINNET_URL`. By default it is [Polygon RPC Public Endpoint](https://polygon-rpc.com/). You might want to switch out with Alchemy Private endpoint for reliability
   1. Go to [Alchemy Dashboard](https://dashboard.alchemyapi.io/) - sign up for an account of get added to Novel's
   2. Click "Create App"
      1. Name it "Novel - <Your Name> Local Testnet" 
      2. Choose "Development" for "Environment"
      3. Choose "Polygon" for "Chain"
      4. Choose "Polygon Mumbai" for "Network"
   3. Create another app
      1. Name it "Novel - <Your Name> Local Mainnet" 
      2. Choose "Production" for "Environment"
      3. Choose "Polygon" for "Chain"
      4. Choose "Polygon Mainnet" for "Network"
   4. Get keys for Alchemy RPC
      1. Click on the Testnet app and click "View API Key"
      2. Copy the HTTP endpoint (ex: `https://polygon-mumbai.g.alchemy.com/v2/KEYISHERE`) into `RPC_MAINNET_URL` into the .env file
      3. Repeat for the testnet, setting `RPC_TESTNET_URL`

## Compile
You must compile all the solidity contracts before running commands. Recompile every time you change a solidity contract.

Just run:
```
yarn compile
```

# Scripts
We have some yarn shortcuts to define the network we run command.

Make sure you switch into the `blockchain` folder.

All the commands are actually defined in hardhat as tasks.

You can do `yarn <network> --help` to get the most current docs on the commands available

Supported Networks are:
* `mumbai`: the testnet
* `polygon`: the mainnet
* `local`: hardhat hardhat local chain

Ane example command would like like this:

`yarn mumbai deploy-paymaster`

## Deploy Paymaster
Command:
```
yarn <network> deploy-paymaster`
```

Example:
```
yarn polygon deploy-paymaster`
```

Should return a contract address, such as, `0xB2Aa3A38FD53bC7F2e3f4e97BeE222C3bbb77209` and write it to a file called `paymaster.polygonMumbai.json`.

Note that it appends the network name.

The purpose of this file is to no deploy the paymaster multiple times (it only needs to be deployed once). 

In production, we will store the paymaster to a central location (ex: S3)

You can verify the paymaster deployed successfully by going to [PolygonScan](https://polygonscan.com/) (for mainnet) or [PolygonScan Mumbai](https://mumbai.polygonscan.com/) (for testnet).

You will see a single transaction labeled `Contract Creation`.

If you want to verify the paymaster automatically, also pass the `--verify` flag. Otherwise use the `verify-paymaster` task below.

## Verify Paymaster
Command: 
```
yarn <network> verify-paymaster
```

Example:
```
yarn polygon verify-paymaster
```

Will verify the contract on PolygonScan. You will see a Green Checkmark under "Contract" if the verification was successful. It also shows the code for the contract on Polygon Scan!

Additionally, you can connect your wallet right in PolygonScan, and run Read/Write commands with a very nice GUI.

## Fill Paymaster
Command: 
```
yarn <network> fill-paymaster --ethtotransfer <amount of matic here>`
```

Example:

```
yarn polygon fill-paymaster --ethtotransfer 10
```

We will transfer some MATIC to the paymaster so that it can pay for customer transactions (ex: minting) and brand transactions (ex: contract creation)

Before doing this you have to fill your wallet with MATIC.

If you're on testnet (mumbai), you can use the [faucet](https://faucet.polygon.technology/). It gives you .5 MATIC at a time. You need to wait about a minute between retries.

Start with filling .25 MATIC, so that it also has enough gas to run the fill transaction.

On mainnet
