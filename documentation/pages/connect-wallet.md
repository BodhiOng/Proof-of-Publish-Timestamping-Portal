# Connect Wallet Page Features

- Route: `/connect-wallet`
- Source: `app/connect-wallet/page.tsx`

## What This Page Does

- Connects user wallet through MetaMask.
- Shows network, chain ID, wallet address, and balance.
- Handles account and chain changes from the wallet provider.

## Notable Behaviors

- Attempts reconnect if wallet session already exists.
- Supports network switching prompts when needed.
- Loads and edits account profile data tied to wallet address.
- Supports profile image upload with validation.
- Uses challenge-based profile create/update API calls.
