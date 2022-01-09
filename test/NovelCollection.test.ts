import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line camelcase, node/no-missing-import
import { NovelCollection, NovelCollection__factory } from "../typechain";

const COLLECTION_NAME = "Cats";
const COLLECTION_SYMBOL = "CAT";
const MAX_QUANTITY = 1000;
const HASH_PROOF = "0x523abcde";
const CONTRACT_URI = "https://metadata-url.com/my-metadata";

describe("NovelCollection", function () {
    // eslint-disable-next-line camelcase
    let NovelCollectionFactory: NovelCollection__factory;
    let nc: NovelCollection;
    let owner: SignerWithAddress;
    // eslint-disable-next-line no-unused-vars
    let creator: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let user3: SignerWithAddress;

    beforeEach(async () => {
        NovelCollectionFactory = await ethers.getContractFactory(
            "NovelCollection",
        );
        nc = await NovelCollectionFactory.deploy(
            COLLECTION_NAME,
            COLLECTION_SYMBOL,
            MAX_QUANTITY,
            HASH_PROOF,
            CONTRACT_URI,
        );
        await nc.deployed();

        [owner, creator, user1, user2, user3] = await ethers.getSigners();
    });

    it("sets initialization parameters", async function () {
        expect(await nc.owner()).to.equal(owner.address);
        expect(await nc.name()).to.equal(COLLECTION_NAME);
        expect(await nc.symbol()).to.equal(COLLECTION_SYMBOL);
        expect(await nc.supplyCap()).to.equal(MAX_QUANTITY);
        expect(await nc.metadataProofHash()).to.equal(HASH_PROOF);
    });

    describe("Token URI", function () {
        it("returns a placeholder URI before reveal", async function () {
            const whitelistTx = await nc.setWhitelistedAmount(
                [user1.address],
                [1],
            );
            await whitelistTx.wait();
            const mintTx = await nc.connect(user1).mint(1);
            await mintTx.wait();

            expect(await nc.isRevealed()).to.equal(false);
            expect(await nc.tokenURI(1)).to.contain("placeholder.json");
        });
        it("returns actual URI after reveal", async function () {
            const whitelistTx = await nc.setWhitelistedAmount(
                [user1.address],
                [1],
            );
            await whitelistTx.wait();
            const mintTx = await nc.connect(user1).mint(1);
            await mintTx.wait();

            expect(await nc.isRevealed()).to.equal(false);
            const revealTx = await nc.reveal("https://realurl.com/");
            await revealTx.wait();

            const startingIndex = await nc.startingIndex();
            const tokenIndex = 1;
            const uri = await nc.tokenURI(tokenIndex);
            expect(uri).to.include("https://realurl.com/");
            expect(uri).to.equal(
                `https://realurl.com/${
                    (startingIndex.toNumber() + tokenIndex) % MAX_QUANTITY
                }.json`,
            );

            expect(await nc.isRevealed()).to.equal(true);
        });
    });

    describe("Minting and Whitelist", function () {
        it("allows the whitelisted user to mint", async function () {
            expect(await nc.balanceOf(user1.address)).to.equal(0);

            const whitelistTx = await nc.setWhitelistedAmount(
                [user1.address],
                [1],
            );
            await whitelistTx.wait();

            const mintTx = await nc.connect(user1).mint(1);
            await mintTx.wait();

            expect(await nc.balanceOf(user1.address)).to.equal(1);
        });

        it("returns whitelist status", async function () {
            expect(await nc.canMintAmount(user1.address, 1)).to.equal(false);
            expect(await nc.canMintAmount(user2.address, 1)).to.equal(false);
            expect(await nc.canMintAmount(user3.address, 1)).to.equal(false);

            const whitelistTx = await nc.setWhitelistedAmount(
                [user1.address, user3.address],
                [3, 5],
            );
            await whitelistTx.wait();

            const mintTx = await nc.connect(user1).mint(1);
            await mintTx.wait();

            expect(await nc.canMintAmount(user1.address, 3)).to.equal(false);
            expect(await nc.canMintAmount(user1.address, 2)).to.equal(true);
            expect(await nc.canMintAmount(user2.address, 1)).to.equal(false);
            expect(await nc.canMintAmount(user3.address, 5)).to.equal(true);
            expect(await nc.canMintAmount(user3.address, 6)).to.equal(false);
        });

        it("removes whitelist status after minting", async function () {
            expect(await nc.canMintAmount(user1.address, 2)).to.equal(false);
            expect(await nc.canMintAmount(user2.address, 3)).to.equal(false);
            expect(await nc.canMintAmount(user3.address, 4)).to.equal(false);

            const whitelistTx = await nc.setWhitelistedAmount(
                [user1.address, user2.address, user3.address],
                [2, 3, 4],
            );
            await whitelistTx.wait();

            const mint1Tx = await nc.connect(user1).mint(2);
            await mint1Tx.wait();

            const mint2Tx = await nc.connect(user2).mint(2);
            await mint2Tx.wait();

            const mint3Tx = await nc.connect(user3).mint(2);
            await mint3Tx.wait();

            expect(await nc.canMintAmount(user1.address, 1)).to.equal(false);
            expect(await nc.canMintAmount(user2.address, 1)).to.equal(true);
            expect(await nc.canMintAmount(user3.address, 2)).to.equal(true);
        });

        it("does not allow total cap to be exceeded", async function () {
            nc = await NovelCollectionFactory.deploy(
                COLLECTION_NAME,
                COLLECTION_SYMBOL,
                20,
                HASH_PROOF,
                CONTRACT_URI,
            );
            await nc.deployed();

            const whitelistTx = await nc.setWhitelistedAmount(
                [user1.address, user2.address, user3.address],
                [20, 10, 10],
            );
            await whitelistTx.wait();

            const mint1Tx = await nc.connect(user1).mint(17);
            await mint1Tx.wait();

            await expect(nc.connect(user2).mint(10)).to.be.revertedWith(
                "NovelCollection: cap reached",
            );

            const mint2Tx = await nc.connect(user2).mint(2);
            await mint2Tx.wait();

            await expect(nc.connect(user3).mint(2)).to.be.revertedWith(
                "NovelCollection: cap reached",
            );

            const mint3Tx = await nc.connect(user3).mint(1);
            await mint3Tx.wait();

            expect(await nc.balanceOf(user1.address)).to.equal(17);
            expect(await nc.balanceOf(user2.address)).to.equal(2);
            expect(await nc.balanceOf(user3.address)).to.equal(1);
        });

        it("enforces whitelist limits", async function () {
            const whitelistTx = await nc.setWhitelistedAmount(
                [user1.address, user2.address, user3.address],
                [2, 3, 4],
            );
            await whitelistTx.wait();

            await expect(nc.connect(user1).mint(3)).to.be.revertedWith(
                "NovelCollection: requested count exceeds whitelist limit",
            );
            await expect(nc.connect(user2).mint(4)).to.be.revertedWith(
                "NovelCollection: requested count exceeds whitelist limit",
            );
            await expect(nc.connect(user3).mint(5)).to.be.revertedWith(
                "NovelCollection: requested count exceeds whitelist limit",
            );

            const mint1Tx = await nc.connect(user1).mint(2);
            await mint1Tx.wait();

            const mint2Tx = await nc.connect(user2).mint(3);
            await mint2Tx.wait();

            const mint3Tx = await nc.connect(user3).mint(4);
            await mint3Tx.wait();

            expect(await nc.balanceOf(user1.address)).to.equal(2);
            expect(await nc.balanceOf(user2.address)).to.equal(3);
            expect(await nc.balanceOf(user3.address)).to.equal(4);
            expect(await nc.canMintAmount(user1.address, 1)).to.equal(false);
            expect(await nc.canMintAmount(user2.address, 1)).to.equal(false);
            expect(await nc.canMintAmount(user3.address, 1)).to.equal(false);
        });
    });
});
