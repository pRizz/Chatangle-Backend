/*!
 * Chatangle Backend
 * Copyright(c) 2017 Peter Ryszkiewicz
 * MIT Licensed
 */

const argv = require('minimist')(process.argv.slice(2), {
    'alias': {
        'h': 'help',
        'i': 'iotaTransactionStreamIP', // see https://github.com/pRizz/IOTA-Transaction-Stream
        'p': 'iotaTransactionStreamPort', // see https://github.com/pRizz/IOTA-Transaction-Stream
        's': 'isIotaTransactionStreamSecured', // if true, then connect to the IOTA Transaction Stream with the wss protocol, else, use ws
        'w': 'webSocketServerPort'
    },
    'default': {
        'iotaTransactionStreamPort': 8008,
        'isIotaTransactionStreamSecured': false,
        'webSocketServerPort': 8008
    }
})

function printHelp() {
    console.log(`chatangle-backend
  The backend service for a free, decentralized, global chatroom, powered by the IOTA tangle. Depends on a working IOTA Transaction Stream.
  Usage: chatangle-backend --iotaTransactionStreamIP=ip [--iotaTransactionStreamPort=port] [--isIotaTransactionStreamSecured=[true|false]] [--webSocketServerPort=port] [--help]
    options:
      -i, --iotaTransactionStreamIP ip : the IP address of the IOTA Transaction Stream
      -p, --iotaTransactionStreamPort port: the port of the IOTA Transaction Stream; defaults to 8008
      -s, --isIotaTransactionStreamSecured [true|false]: if true, then connect to the IOTA Transaction Stream with the wss protocol, else, use ws; defaults to false
      -w, --webSocketServerPort port: the port of the WebSocket server which facilitates the Chatangle frontend; defaults to 8008
      -h, --help : print this help info
  
  Example usage: chatangle-backend --iotaTransactionStreamIP 123.45.67.890 --iotaTransactionStreamPort 8008 --isIotaTransactionStreamSecured false --webSocketServerPort 8008
  Example if running from an IDE: npm run start -- --iotaTransactionStreamIP 123.45.67.890 --iotaTransactionStreamPort 8008 --isIotaTransactionStreamSecured false --webSocketServerPort 8008
    `)
    process.exit(0)
}

if(argv.help) {
    printHelp()
}

if(!argv.iotaTransactionStreamIP) {
    console.error(`You must supply an IP address to --iotaTransactionStreamIP`)
    printHelp()
}

const transactionStreamSubscriberFilter = require('./lib/TransactionStreamSubscriberFilter')(argv.iotaTransactionStreamIP, argv.iotaTransactionStreamPort, argv.isIotaTransactionStreamSecured)
const chatangleWebSocketServer = require('./routes/chatangleWebSocketServer')(argv.webSocketServerPort)
const recentMessageCache = require('./lib/RecentMessageCache')

chatangleWebSocketServer.setMessageCache(recentMessageCache)

transactionStreamSubscriberFilter.setTransactionCallback(transaction => {
    recentMessageCache.addMessage(transaction)
    chatangleWebSocketServer.broadcastObjectToClients(transaction, 'newMessage')
})

module.exports = {}
