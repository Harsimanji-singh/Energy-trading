const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("EnergyNft test", function () {
          let EnergyNft, deployer, player
          let name = "harsimran",
              description = "dosanjh",
              imageURI = "http://example.jpg",
              tokenURI = "http://expample.token"
          beforeEach(async function () {
              deployer = (await getNamedAccounts()).deployer

              await deployments.fixture(["energynft"])
              EnergyNft = await ethers.getContract("EnergyNft")
          })
          describe("Constructor", () => {
              it("initilize the constructor correctly", async () => {
                  const name = await EnergyNft.name()
                  const symbol = await EnergyNft.symbol()
                  const tokenId = await EnergyNft.getTokenCounter()
                  const auctionId = await EnergyNft.getAuctionCounter()
                  assert.equal(name, "Energy Asset Token")
                  assert.equal(symbol, "EAT")
                  assert.equal(tokenId, "0")
                  assert.equal(auctionId, "0")
              })
          })
          describe("mintEnergyAsset", () => {
              let recipt, txResponse
              beforeEach(async () => {
                  txResponse = await EnergyNft.mintEnergyAsset(
                      name,
                      description,
                      imageURI,
                      tokenURI
                  )
                  recipt = await txResponse.wait(1)
              })
              it("update the token uri correctly", async () => {
                  const tokenId = await EnergyNft.getTokenCounter()
                  const tokenURItx = await EnergyNft.tokenURI(0)
                  assert.equal(tokenURItx, tokenURI)
              })
              it("increment the token counter correctly", async () => {
                  const tokenId = await EnergyNft.getTokenCounter()
                  assert.equal(tokenId.toString(), "1")
              })
              it("update the energyasset mapping correctly", async () => {
                  const asset = await EnergyNft.getEnergyAsset(0)
                  assert.equal(asset.name, name)
                  assert.equal(asset.description, description)
                  assert.equal(asset.imageURI, imageURI)
                  assert.equal(asset.timestamp > 0, true)
                  // it is also in reasonable range
                  //   const currenttimestamp = Math.floor(Date.now() / 1000)
                  //   assert.equal(asset.timestamp <= currenttimestamp, true)
              })
              it("emit the event correctly", async () => {
                  expect(
                      await EnergyNft.mintEnergyAsset(
                          name,
                          description,
                          imageURI,
                          tokenURI
                      )
                  ).to.emit("NFTMinted")
              })
              //    it('should not allow non-owner to mint energy asset NFT', async () => {
              //     // Attempt to mint a new energy asset NFT by a non-owner account
              //     await truffleAssert.reverts(
              //       nftContract.mintEnergyAsset(name, description, imageURI, tokenURI, { from: nonOwner }),
              //       'Only the contract owner can mint energy assets'
              //     );
              //   });
              //  await expect(
              //                       nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
              //                   ).to.be.revertedWith(error)
              it("should not allow non-user to mint the nft", async () => {
                  const accounts = await ethers.getSigners()
                  const player = accounts[2]
                  await expect(
                      EnergyNft.mintEnergyAsset(
                          name,
                          description,
                          imageURI,
                          tokenURI,
                          { from: player }
                      )
                  ).to.be.reverted
              })
          })
          describe("startAuction", () => {
              beforeEach(async () => {
                  txResponse = await EnergyNft.mintEnergyAsset(
                      name,
                      description,
                      imageURI,
                      tokenURI
                  )
                  recipt = await txResponse.wait(1)
              })
              let tokenId = 0,
                  startPrice = 1,
                  duration = 10
              it("should not allow non-user to start auction", async () => {
                  const acconts = await ethers.getSigners()
                  const player = acconts[2]
                  await expect(
                      EnergyNft.startAuction(tokenId, startPrice, duration, {
                          from: player,
                      })
                  ).to.be.reverted
              })
              it("should revert an error if startPrice is 0", async () => {
                  await expect(
                      EnergyNft.startAuction(tokenId, 0, duration)
                  ).to.be.revertedWith("invalid start price")
              })
              it("should revert an error if tokenId do not exist", async () => {
                  await expect(
                      EnergyNft.startAuction(4, startPrice, duration)
                  ).to.be.revertedWith("Token with given ID do not exist")
              })
              it("should revert an error if duration is 0", async () => {
                  let durations = 0
                  await expect(
                      EnergyNft.startAuction(tokenId, startPrice, durations)
                  ).to.be.revertedWith("invalid duration")
              })
              it("initilize the newAuctionItem correctly", async () => {
                  const acconts = ethers.getSigners()
                  const emptyAddress = "0x" + "0".repeat(40)
                  const startTimeBefore = Math.floor(Date.now() / 1000)
                  const tx = await EnergyNft.startAuction(
                      tokenId,
                      startPrice,
                      duration
                  )
                  tx.wait(1)
                  const startTimeAfter = Math.floor(Date.now() / 1000)

                  const auction = await EnergyNft.getAuctionDetails(tokenId)
                  assert.equal(auction.auctionIds.toNumber(), 1)
                  assert.equal(auction.tokenId, tokenId)
                  assert.equal((auction.seller, acconts[0]))
                  assert.equal(auction.startPrice, startPrice)

                  assert.equal(
                      auction.endTimeStamp.toNumber(),
                      auction.startTimeStamp.toNumber() + duration
                  )
                  assert.equal(auction.highestBidder, emptyAddress)
                  assert.equal(auction.highestBid, 0)
                  assert.equal(auction.cancelled, false)
                  assert.equal(auction.completed, false)
              })
              it("it should emit the AuctionCreated events", async () => {
                  expect(
                      await EnergyNft.startAuction(
                          tokenId,
                          startPrice,
                          duration
                      )
                  ).to.emit("AuctionCreated")
              })
          })
          describe("placeBid", () => {
              let tokenId = 0,
                  startPrice = 1,
                  duration = 1000
              beforeEach(async () => {
                  txResponse = await EnergyNft.mintEnergyAsset(
                      name,
                      description,
                      imageURI,
                      tokenURI
                  )
                  recipt = await txResponse.wait(1)
                  await EnergyNft.startAuction(0, startPrice, duration)
              })
              it("should revert an error if auction is not started", async () => {
                  //   const auction = await EnergyNft.getAuctionDetails(0)
                  await network.provider.send("evm_increaseTime", [-3600])
                  await network.provider.send("evm_mine")

                  await expect(
                      EnergyNft.placeBid(0, { value: 1 })
                  ).to.be.revertedWith("Auction has not started")

                  //   assert.equal(0, 1)
              })
              it("should revert an error if the auction is ended", async () => {
                  //   const auction = await EnergyNft.getAuctionDetails(0)

                  await network.provider.send("evm_increaseTime", [3600])
                  await network.provider.send("evm_mine")
                  await expect(
                      EnergyNft.placeBid(0, { value: 1 })
                  ).to.be.revertedWith("Auction has ended")
              })
              it("should revert an error if the value is 0", async () => {
                  await expect(
                      EnergyNft.placeBid(0, { value: 0 })
                  ).to.be.revertedWith(
                      "Bid must be higher than cuurent highestBid"
                  )
              })
              it("should pay the previous bidder their amount", async () => {
                  const accounts = await ethers.getSigners()
                  const player = accounts[2]
                  const address = await player.getAddress()
                  const balanceBefore = await ethers.provider.getBalance(
                      address
                  )
                  const energyNftSigner = await EnergyNft.connect(player)
                  const tx = await energyNftSigner.placeBid(0, { value: 1 })
                  const response = await tx.wait(1)
                  const tx2 = await EnergyNft.placeBid(0, { value: 2 })
                  await tx2.wait(1)
                  const balanceafter = await ethers.provider.getBalance(address)
                  const gasFee = response.gasUsed.toBigInt()
                  const gas = response.effectiveGasPrice.toBigInt()
                  const gasused = gasFee * gas
                  //as it return the bid to previous the balance before and at end musht bve equal
                  assert.equal(
                      balanceBefore.toBigInt(),
                      balanceafter.toBigInt() + gasused
                  )
              })
              it("should update the auction mapping correcly", async () => {
                  await EnergyNft.placeBid(0, { value: 1 })
                  const auction = await EnergyNft.getAuctionDetails(0)
                  assert.equal(auction.highestBid, 1)
                  assert.equal(auction.highestBidder, deployer)
              })
              it("should emit the Bidplaced event", async () => {
                  expect(await EnergyNft.placeBid(0, { value: 1 })).to.be.emit(
                      "BidPlaced"
                  )
              })
          })
          describe("CancelAuction", () => {
              let tokenId = 0,
                  startPrice = 1,
                  duration = 10000000
              beforeEach(async () => {
                  txResponse = await EnergyNft.mintEnergyAsset(
                      name,
                      description,
                      imageURI,
                      tokenURI
                  )
                  recipt = await txResponse.wait(1)
                  await EnergyNft.startAuction(0, startPrice, duration)
              })
              it("should revert the error if non-owner user try to cancel", async () => {
                  const acconts = ethers.getSigners()
                  const player = acconts[2]
                  const playerad = await EnergyNft.connect(player)
                  await expect(playerad.cancelAuction(0)).to.be.reverted
              })
              it("should revert the error if the auction is already ended", async () => {
                  await EnergyNft.cancelAuction(0)
                  await expect(EnergyNft.cancelAuction(0)).to.be.revertedWith(
                      "Auction is already cancelled"
                  )
              })
              it("should pay back the money of previous bidder", async () => {
                  const acconts = await ethers.getSigners()
                  const player = acconts[2]
                  const playerAddress = await player.getAddress()
                  const playerSigner = await EnergyNft.connect(player)
                  const beforeBalance = await ethers.provider.getBalance(
                      playerAddress
                  )
                  const tx = await playerSigner.placeBid(0, { value: 1 })
                  const recipt = await tx.wait(1)
                  const gasFee = recipt.effectiveGasPrice.toBigInt()
                  const gasUsed = recipt.gasUsed.toBigInt()
                  const gasPrice = gasFee * gasUsed
                  await EnergyNft.cancelAuction(0)
                  const balanceAfter = await ethers.provider.getBalance(
                      playerAddress
                  )
                  assert.equal(
                      beforeBalance.toBigInt(),
                      balanceAfter.toBigInt() + gasPrice
                  )
              })
              it("should change the state of cancelled bool to true", async () => {
                  await EnergyNft.cancelAuction(0)
                  const auction = await EnergyNft.getAuctionDetails(0)
                  assert.equal(auction.cancelled, true)
              })
              it("should emit an AuctionCancelled event", async () => {
                  expect(await EnergyNft.cancelAuction(0))
                      .to.be.emit("AuctionCancelled")
                      .withArgs(0)
              })
          })
          describe("completeAuction", async () => {
              let tokenId = 0,
                  startPrice = 1,
                  duration = 3600
              beforeEach(async () => {
                  txResponse = await EnergyNft.mintEnergyAsset(
                      name,
                      description,
                      imageURI,
                      tokenURI
                  )
                  recipt = await txResponse.wait(1)
                  await EnergyNft.startAuction(0, startPrice, duration)
              })
              it("should revert an error if auction is cancelled", async () => {
                  await EnergyNft.cancelAuction(0)
                  await expect(EnergyNft.completeAuction(0)).to.be.revertedWith(
                      "Auction is cancelled"
                  )
              })
              it("should revert an error if auction is already completed", async () => {
                  await network.provider.send("evm_increaseTime", [3600])
                  await network.provider.send("evm_mine")
                  await EnergyNft.completeAuction(0)
                  await expect(EnergyNft.completeAuction(0)).to.be.revertedWith(
                      "Auction is already completed"
                  )
              })
              it("should revert an error if the endtimestamp is not complete", async () => {
                  await expect(EnergyNft.completeAuction(0)).to.be.revertedWith(
                      "Auction has not ended yet"
                  )
              })
              it("should update the auction item completed to true", async () => {
                  await network.provider.send("evm_increaseTime", [3600])
                  await network.provider.send("evm_mine")
                  await EnergyNft.completeAuction(0)
                  const auction = await EnergyNft.getAuctionDetails(0)
                  assert.equal(auction.completed, true)
              })
              it("should transfer nft to highest bidder", async () => {
                  const acconts = await ethers.getSigners()
                  const player = acconts[2]
                  const playerAddress = await player.getAddress()
                  const playerSigner = await EnergyNft.connect(player)
                  await playerSigner.placeBid(0, { value: 1 })
                  await network.provider.send("evm_increaseTime", [3600])
                  await network.provider.send("evm_mine")
                  await EnergyNft.completeAuction(0)
                  const energyasset = await EnergyNft.getTokenAddress(0)
                  assert.equal(energyasset, playerAddress)
              })
              it("should emit the AuctionCompleted event", async () => {
                  await network.provider.send("evm_increaseTime", [3600])
                  await network.provider.send("evm_mine")
                  expect(await EnergyNft.completeAuction(0)).to.be.emit(
                      "AuctionCompleted"
                  )
              })
              describe("Auction Bidding", () => {
                  it("it check the start auction bidding and complete auction", async () => {
                      let beforeBalanceOwner, afterBalanceOwner
                      const accounts = await ethers.getSigners()
                      const player = accounts[2]
                      const playerAddress = await player.getAddress()
                      const playerSigner = await EnergyNft.connect(player)
                      await EnergyNft.mintEnergyAsset(
                          name,
                          description,
                          imageURI,
                          tokenURI
                      )

                      await new Promise(async (resolve, reject) => {
                          // set up the listener for the complete event
                          EnergyNft.once("AuctionCompleted", async () => {
                              //do testing

                              try {
                                  const owner = await EnergyNft.ownerOf(0)
                                  assert.equal(owner, playerAddress)

                                  resolve()
                              } catch (error) {
                                  console.log(error)
                                  reject(error)
                              }
                          })
                          // start the auction

                          let tokenID = 0,
                              startPrice = 1,
                              duration = 10
                          await EnergyNft.startAuction(0, startPrice, duration)
                          await playerSigner.placeBid(0, { value: 1 })
                          await expect(
                              EnergyNft.completeAuction(0)
                          ).to.be.revertedWith("Auction has not ended yet")
                          setTimeout(async () => {
                              await EnergyNft.completeAuction(0)
                          }, 10000)
                      })
                  })
              })
          })
      })
