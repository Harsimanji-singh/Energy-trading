const { ethers, network } = require("hardhat")
const fs = require("fs")
const { ECDH } = require("crypto")
// const { ethers } = require("ethers")
const frontEndContractFile = "./constants/networkMapping.json"
const FRONT_END_ABI_FILE = "./constants/abi.json"

module.exports = async function () {
    if (process.env.UPDATE_FRONT_END) {
        console.log("updating front end")
        // await updateContractAddress()
        await updateAbi()
    }
}
async function updateAbi() {
    const energyTrading = await ethers.getContract("EnergyNft")
    fs.writeFileSync(
        `${FRONT_END_ABI_FILE}NftMarketplace.json`,
        JSON.stringify(energyTrading.interface)
    )
}
async function updateContractAddress() {
    const ChainId = network.config.chainId.toString()
    const energyTrading = await ethers.getContract("EnergyNft")
    const contractAddress = JSON.stringify(
        fs.readFileSync(frontEndContractFile, "utf8")
    )
    if (ChainId in contractAddress) {
        if (
            !contractAddress[ChainId]["EnergyNft"].includes(
                energyTrading.address
            )
        ) {
            contractAddress[ChainId]["EnergyNft"].push(energyTrading.address)
        }
    } else {
        contractAddress[ChainId] = {
            EnergyNft: [energyTrading.address],
        }
    }
    fs.writeFileSync(frontEndContractFile, JSON.stringify(contractAddress))
}
module.exports.tags = ["all", "frontend"]
