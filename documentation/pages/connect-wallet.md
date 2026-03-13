# Connect Wallet Page Features

- Route: `/connect-wallet`
- Source: `app/connect-wallet/page.tsx`

## What This Page Does

- Connects user wallet through MetaMask.
- Shows network, chain ID, wallet address, and balance.
- Handles account and chain changes from the wallet provider.
- Loads account profile by wallet from backend API.
- Supports create/update profile with challenge-message signature flow.

## Notable Behaviors

- Attempts reconnect if wallet session already exists.
- Includes optional network-switch action in UI.
- Loads and edits account profile data tied to wallet address.
- Supports profile image upload with validation.
- Uses challenge-based profile create/update API calls.

## Validation Rules

- Username: 3-24 characters, letters/numbers/underscore.
- Website: must start with `http://` or `https://` when provided.
- Uploaded avatar image: image data URL only, with size limits.

## Local Development Notes

- For local flows, keep MetaMask on Localhost 8545 (Chain ID 1337).
- If MetaMask displays a Mainnet transaction prompt, cancel and switch network manually.
