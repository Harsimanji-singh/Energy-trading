const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const {
    isCallTrace,
} = require("hardhat/internal/hardhat-network/stack-traces/message-trace")
developmentChains.includes(network.name)
    ? describe.skip
    : describe("staging test for energyNft", () => {
          let EnergyNft, deployer, player, accounts
          let name = "Solar pannel",
              description = "renewable energy",
              imageURI = "http://example.jpg",
              tokenuri = "http://expample.token"
          beforeEach(async () => {
              deployer = (await getNamedAccounts()).deployer

              await deployments.fixture(["energynft"])
              EnergyNft = await ethers.getContract("EnergyNft")
          })
          //   it("should mint an energy asset", async () => {
          //       const tx = await EnergyNft.mintEnergyAsset(
          //           name,
          //           description,
          //           imageURI,
          //           tokenuri
          //       )
          //       await tx.wait(1)
          //       const tokenURI = await EnergyNft.tokenURI(0)
          //       const tokenOwner = await EnergyNft.ownerOf(0)

          //       assert.equal(tokenOwner, deployer)
          //       assert.equal(tokenURI, tokenuri)
          //       expect(
          //           await EnergyNft.mintEnergyAsset(
          //               name,
          //               description,
          //               imageURI,
          //               tokenURI
          //           )
          //       ).to.emit("NFTMinted")
          //   })
          describe("Auction Bidding", () => {
              it("it check the start auction bidding and complete auction", async () => {
                  const accounts = await ethers.getSigners()
                  const player = accounts[2]
                  const playerSigner = await EnergyNft.connect(player)
                  const playeraddress = await player.getAddress()
                  console.log("minting")
                  await EnergyNft.mintEnergyAsset(
                      name,
                      description,
                      imageURI,
                      tokenuri
                  )
                  console.log("testing")
                  await new Promise(async (resolve, reject) => {
                      // set up the listener for the complete event
                      EnergyNft.once("AuctionCompleted", async () => {
                          //do testing
                          console.log("hellos")
                          try {
                              const owner = await EnergyNft.ownerOf(0)
                              assert.equal(owner === playeraddress, false)
                              assert.equal(owner, playeraddress)
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      // start the auction

                      let tokenID = 0,
                          startPrice = 1,
                          duration = 10
                      console.log("start auctoin ")
                      await EnergyNft.startAuction(0, startPrice, duration)
                      console.log("auction is started")
                      await playerSigner.placeBid(0, { value: 1 })
                      console.log("bidplaced")
                      setTimeout(async () => {
                          console.log("call complete auction")
                          await EnergyNft.completeAuction(0)
                      }, 10000)
                  })
              })
          })
      })
