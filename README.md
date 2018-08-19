# Chatangle Backend

[![Greenkeeper badge](https://badges.greenkeeper.io/pRizz/Chatangle-Backend.svg)](https://greenkeeper.io/)

The backend for [Chatangle](https://github.com/pRizz/Chatangle); a free, decentralized, global chatroom, powered by the IOTA tangle.

# Installation Instructions

## General Installation
For global installation:

```bash
npm install -g chatangle-backend
```

This will make Chatangle Backend available as the command `chatangle-backend`.

### Installation Errors
If you get errors during install about bad permissions, your `npm` was probably installed as the root user. It is recommended to install `npm` as non-root, like with `nvm`. A workaround is to install with the `--unsafe-perm` flag like so:

```bash
npm install -g --unsafe-perm chatangle-backend
```

# Usage
You must have a working [IOTA Transaction Stream](https://github.com/pRizz/IOTA-Transaction-Stream).

If globally installed, example:

```bash
chatangle-backend --iotaTransactionStreamIP 123.45.67.890 --iotaTransactionStreamPort 8008 --isIotaTransactionStreamSecured false --webSocketServerPort 8008
```

If installed locally or running from an IDE:

```bash
npm run start -- --iotaTransactionStreamIP 123.45.67.890 --iotaTransactionStreamPort 8008 --isIotaTransactionStreamSecured false --webSocketServerPort 8008
```

Running in the background, example: 

```bash
nohup --iotaTransactionStreamIP 123.45.67.890 --iotaTransactionStreamPort 8008 --isIotaTransactionStreamSecured false --webSocketServerPort 8008 >> output.log &
```

Then tail the logs with 

```bash
tail -f output.log
```

If `PORT` is specified in the environment, this will override `webSocketServerPort`

### Hooking Into The Backend

These lines of Javascript can be copy-pasted into the Chrome console after starting the server locally to test if the backend is working:

```Javascript
let ws = new WebSocket('ws://chatangleBackendIP:8008')
ws.addEventListener('message', message => {console.log('message', message)})
ws.addEventListener('error', message => {console.error('error', message)})
ws.addEventListener('open', message => {console.log('open', message)})
```