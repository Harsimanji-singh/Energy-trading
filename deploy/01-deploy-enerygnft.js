const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    log("---------------------")
    const args = []
    const enerygNft = await deploy("EnergyNft", {
        from: deployer,
        args: args,
        log: true,
    })
    log("-------------deployed-------------------")
}
module.exports.tags = ["all", "energynft"]
