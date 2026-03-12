// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract PublicationRegistry {
    struct Publication {
        address publisher;
        uint64 registeredAt;
        bytes32 parentHash;
        string contentType;
        bool exists;
    }

    mapping(bytes32 => Publication) private _publications;

    event PublicationRegistered(
        bytes32 indexed contentHash,
        address indexed publisher,
        uint256 timestamp,
        bytes32 indexed parentHash,
        string contentType
    );

    function registerPublication(
        bytes32 contentHash,
        string calldata contentType,
        bytes32 parentHash
    ) external {
        require(contentHash != bytes32(0), "Content hash is required");
        require(bytes(contentType).length > 0, "Content type is required");
        require(!_publications[contentHash].exists, "Publication already exists");

        if (parentHash != bytes32(0)) {
            Publication memory parent = _publications[parentHash];
            require(parent.exists, "Parent publication not found");
            require(parent.publisher == msg.sender, "Only parent publisher can create child version");
        }

        _publications[contentHash] = Publication({
            publisher: msg.sender,
            registeredAt: uint64(block.timestamp),
            parentHash: parentHash,
            contentType: contentType,
            exists: true
        });

        emit PublicationRegistered(contentHash, msg.sender, block.timestamp, parentHash, contentType);
    }

    function hasPublication(bytes32 contentHash) external view returns (bool) {
        return _publications[contentHash].exists;
    }

    function getPublication(bytes32 contentHash)
        external
        view
        returns (
            address publisher,
            uint256 registeredAt,
            bytes32 parentHash,
            string memory contentType,
            bool exists
        )
    {
        Publication memory publication = _publications[contentHash];
        return (
            publication.publisher,
            publication.registeredAt,
            publication.parentHash,
            publication.contentType,
            publication.exists
        );
    }
}
