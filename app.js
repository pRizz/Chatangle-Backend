/*!
 * Chatangle Backend
 * Copyright(c) 2017 Peter Ryszkiewicz
 * MIT Licensed
 */

const TransactionStreamSubscriberFilter = require('./lib/TransactionStreamSubscriberFilter')
const ChatangleWebSocketServer = require('./routes/chatangleWebSocketServer')
const RecentMessageCache = require('./lib/RecentMessageCache')

module.exports = function({ iotaTransactionStreamIP, iotaTransactionStreamPort, isIotaTransactionStreamSecured, webSocketServerPort }) {
    const transactionStreamSubscriberFilter = TransactionStreamSubscriberFilter(iotaTransactionStreamIP, iotaTransactionStreamPort, isIotaTransactionStreamSecured)
    const chatangleWebSocketServer = ChatangleWebSocketServer(process.env.PORT || webSocketServerPort)

    chatangleWebSocketServer.setMessageCache(RecentMessageCache)

    transactionStreamSubscriberFilter.setTransactionCallback(transaction => {
        RecentMessageCache.addMessage(transaction)
        chatangleWebSocketServer.broadcastObjectToClients(transaction, 'newMessage')
    })
}