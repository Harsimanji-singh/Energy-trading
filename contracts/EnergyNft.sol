// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// import "@opnezeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EnergyNft is ERC721URIStorage, Ownable {
    struct Bid {
        address payable bidder;
        uint256 amount;
        uint256 timeStamp;
    }
    struct EnergyAsset {
        string name;
        string description;
        string imageURI;
        uint256 timestamp;
    }
    struct AuctionItem {
        uint256 auctionId;
        uint256 tokenId;
        address seller;
        uint256 startPrice;
        uint256 duration;
        uint256 startTimeStamp;
        uint256 endTimeStamp;
        address payable highestBidder;
        uint256 highestBid;
        // Bid[] bids;
        bool cancelled;
        bool completed;
    }

    uint256 private s_auctionIds;
    uint256 private s_tokenCounter;

    mapping(uint256 => EnergyAsset) private energyAssets;
    mapping(uint256 => Bid[]) private auctionBids;
    mapping(uint256 => AuctionItem) private auctions;

    event NFTMinted(uint256 tokenId, address owner, string tokenUri);
    event AuctionCreated(
        uint256 auctionId,
        uint256 tokenId,
        address seller,
        uint256 startPrice,
        uint256 duration,
        uint256 startTimeStamp,
        uint256 endTimeStamp
    );
    event BidPlaced(
        uint256 auctionId,
        address bidder,
        uint256 bid,
        uint256 timeStamp
    );
    event AuctionCancelled(uint256 auctionId);
    event AuctionCompleted(
        uint256 auctionId,
        address highestBidder,
        uint256 highestBid
    );

    constructor() ERC721("Energy Asset Token", "EAT") {
        s_tokenCounter = 0;
        s_auctionIds = 0;
    }

    ///////////////////////////// MODIFIER ////////////////
    modifier onlyTokenOwner(uint256 tokenId, address sender) {
        require(_exists(tokenId), "Token with given ID do not exist");
        require(
            ownerOf(tokenId) == sender,
            "only token Owner can perform this operation"
        );
        _;
    }

    function mintEnergyAsset(
        string memory name,
        string memory description,
        string memory imageURI,
        string memory tokenURI
    ) public onlyOwner {
        s_tokenCounter = s_tokenCounter + 1;
        _mint(msg.sender, s_tokenCounter);
        EnergyAsset memory newAsset = EnergyAsset({
            name: name,
            description: description,
            imageURI: imageURI,
            timestamp: block.timestamp
        });
        energyAssets[s_tokenCounter] = newAsset;
        _setTokenURI(s_tokenCounter, tokenURI);

        emit NFTMinted(s_tokenCounter, msg.sender, tokenURI);
    }

    function startAuction(
        uint256 tokenId,
        uint256 startPrice,
        uint256 duration
    ) public onlyTokenOwner(tokenId, msg.sender) returns (uint256) {
        require(startPrice > 0, "invalid start price");
        require(duration > 0, "invalid duration");
        s_auctionIds++;
        uint256 startTimeStamp = block.timestamp;
        uint256 endTimeStamp = block.timestamp + duration;

        AuctionItem memory newAuction = AuctionItem({
            auctionId: s_auctionIds,
            tokenId: tokenId,
            seller: msg.sender,
            startPrice: startPrice,
            duration: duration,
            startTimeStamp: startTimeStamp,
            endTimeStamp: endTimeStamp,
            highestBidder: payable(address(0)),
            highestBid: 0,
            // bids: new Bid[](0),
            cancelled: false,
            completed: false
        });
        auctions[tokenId] = newAuction;
        // safeTransferFrom(_msgSender(), address(this), tokenId);
        emit AuctionCreated(
            s_auctionIds,
            tokenId,
            _msgSender(),
            startPrice,
            duration,
            startTimeStamp,
            endTimeStamp
        );
        return s_auctionIds;
    }

    function placeBid(uint256 tokenId) public payable {
        AuctionItem storage auction = auctions[tokenId];
        require(
            auction.startTimeStamp <= block.timestamp,
            "Auction has not started"
        );
        require(auction.endTimeStamp >= block.timestamp, "Auction has ended");
        require(auction.cancelled == false, "Auction is cancelled");
        require(
            msg.value > auction.highestBid,
            "Bid must be higher than cuurent highestBid"
        );

        if (auction.highestBidder != address(0)) {
            // refund previous  highers bidder
            payable(auction.highestBidder).transfer(auction.highestBid);
        }
        Bid memory newBid = Bid({
            bidder: payable(msg.sender),
            amount: msg.value,
            timeStamp: block.timestamp
        });
        // auction.bids.push(newBid);
        auctionBids[tokenId].push(newBid);
        auction.highestBidder = payable(msg.sender);
        auction.highestBid = msg.value;
        emit BidPlaced(tokenId, msg.sender, msg.value, block.timestamp);
    }

    function cancelAuction(uint256 tokenId) external {
        AuctionItem storage auction = auctions[tokenId];
        require(auction.seller == msg.sender, "Not the owner");
        require(auction.cancelled == false, "Auction is already cancelled");
        if (auction.highestBidder != address(0)) {
            // refund previous  highers bidder
            payable(auction.highestBidder).transfer(auction.highestBid);
        }
        auction.cancelled = true;
        // for (uint256 i = 0; i < auction.bids.length; i++) {
        //     Bid memory bid = auction.bids[i];
        //     bid.bidder.transfer(bid.amount);
        // }
        //__unsafe_increaseBalance

        // safeTransferFrom(msg.sender, auction.seller, auction.tokenId);
        emit AuctionCancelled(tokenId);
    }

    function completeAuction(uint256 auctionId) external {
        AuctionItem storage auction = auctions[auctionId];
        require(auction.cancelled == false, "Auction is cancelled");
        require(auction.completed == false, "Auction is already completed");
        require(
            auction.endTimeStamp < block.timestamp,
            "Auction has not ended yet"
        );

        auction.completed = true;
        // transfet token
        if (auction.highestBidder != address(0)) {
            safeTransferFrom(
                auction.seller,
                auction.highestBidder,
                auction.tokenId
            );
        }

        emit AuctionCompleted(
            auctionId,
            auction.highestBidder,
            auction.highestBid
        );
    }

    function getEnergyAsset(
        uint256 tokenId
    ) external view returns (EnergyAsset memory) {
        require(_exists(tokenId), "EnergyAssetToken: Token ID does not exist");
        return energyAssets[tokenId];
    }

    function getTokenCounter() public view returns (uint256) {
        return s_tokenCounter;
    }

    function getAuctionCounter() public view returns (uint256) {
        return s_auctionIds;
    }

    function getAuctionDetails(
        uint256 auctionId
    )
        external
        view
        returns (
            uint256 auctionIds,
            uint256 tokenId,
            address seller,
            uint256 startPrice,
            uint256 reservePrice,
            uint256 startTimeStamp,
            uint256 endTimeStamp,
            address highestBidder,
            uint256 highestBid,
            bool cancelled,
            bool completed
        )
    {
        AuctionItem storage auction = auctions[auctionId];
        return (
            auction.auctionId,
            auction.tokenId,
            auction.seller,
            auction.startPrice,
            auction.duration,
            auction.startTimeStamp,
            auction.endTimeStamp,
            auction.highestBidder,
            auction.highestBid,
            auction.cancelled,
            auction.completed
        );
    }

    function getHighestBid(
        uint256 tokenId
    ) public view returns (uint256, address) {
        AuctionItem storage auction = auctions[tokenId];
        return (auction.highestBid, auction.highestBidder);
    }

    function getTokenAddress(uint256 tokenId) public view returns (address) {
        return ownerOf(tokenId);
    }
}
