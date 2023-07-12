/** @type import('hardhat/config').HardhatUserConfig */

require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-ethers")
require("@nomiclabs/hardhat-etherscan")
require("hardhat-deploy")
require("solidity-coverage")
require("hardhat-contract-sizer")
require("dotenv").config()
require("hardhat-gui")
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "key"

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        // developments:{
        //     url: "http://localhost:8545",
        //     custom_domains: ["myproject.com", "subdomain.myproject.com"],
        //     subdomain: "my-subdomain",
        // },
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
            // subdomain: "my-subdomain",

            // blockGasLimit: 3000000000000,
        },
        localhost: {
            chainId: 31337,
            // blockGasLimit: 3000000000000,
        },
        // georli:{
        //   chainId:5,
        //   blockConfirmations:6,
        //   url:
        //   acconts:
        // },
        sepolia: {
            url: SEPOLIA_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 11155111,
            blockConfirmations: 3,
        },
    },
    solidity: "0.8.8",
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },

    gasReporter: {
        enabled: true,
        outputFile: "gas-report.txt",
        noColors: true,
        currency: "USD",
        // coinmarketcap: COINMARKETCAP_API_KEY
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
    },
    mocha: {
        timeout: 200000,
    },
}
