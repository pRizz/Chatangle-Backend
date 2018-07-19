/*!
 * Chatangle Backend
 * Copyright(c) 2017 Peter Ryszkiewicz
 * MIT Licensed
 */

const TransactionStreamSubscriberFilter = require('./lib/TransactionStreamSubscriberFilter')
const ChatangleWebSocketServer = require('./routes/chatangleWebSocketServer')
const RecentMessageCache = require('./lib/RecentMessageCache')

let chatangleWebSocketServer = null

function start({ iotaTransactionStreamIP, iotaTransactionStreamPort, isIotaTransactionStreamSecured, webSocketServerPort }) {
    if(chatangleWebSocketServer) {
        console.log('Already started chatangleWebSocketServer')
        return
    }
    const transactionStreamSubscriberFilter = TransactionStreamSubscriberFilter(iotaTransactionStreamIP, iotaTransactionStreamPort, isIotaTransactionStreamSecured)
    chatangleWebSocketServer = ChatangleWebSocketServer.start({ webSocketServerPort: process.env.PORT || webSocketServerPort })

    chatangleWebSocketServer.setMessageCache(RecentMessageCache)

    transactionStreamSubscriberFilter.setTransactionCallback(transaction => {
        RecentMessageCache.addMessage(transaction)
        chatangleWebSocketServer.broadcastObjectToClients(transaction, 'newMessage')
    })
}

async function stop() {
    if(!chatangleWebSocketServer) {
        console.error('No chatangleWebSocketServer to stop')
        return
    }

    const localChatangleWebSocketServer = chatangleWebSocketServer
    chatangleWebSocketServer = null
    await localChatangleWebSocketServer.stop()
}

module.exports = {
    start,
    stop
}