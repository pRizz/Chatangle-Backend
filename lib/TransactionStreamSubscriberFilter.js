/*!
 * Chatangle Backend
 * Copyright(c) 2017 Peter Ryszkiewicz
 * MIT Licensed
 */

const WebSocket = require('ws')
const TryteEncoderDecoder = require('tryte-utf8-json-codec')

let webSocketClient = null
let webSocketURL = null

/**
 * Transaction message format:
 * {
 *  "app": "Chatangle", // required
 *  "apiVersion": 1, // required
 *  "payload": { // required
 *    "name": String, // optional
 *    "message": String, // required
 *    "avatar": SVG base64 encoded? // optional, TODO
 *  }
 * }
 */


/**
 * Encrypted transaction message format:
 * {
 *  "app": "Chatangle", // required
 *  "apiVersion": 1, // required
 *  "encryptedPayload": "base64EncodedPGPEncryptedJSONPayloadString" // base64(pgpEncrypt(JSON.stringify(payloadObject), password))
 * }
 */

// TODO: Handle multipart objects spread in a bundle across multiple transactions
function chatanglePayloadFromTransaction(transaction) {
    const transactionMessageObject = TryteEncoderDecoder.objectFromTritifiedJSON(transaction.signatureMessageFragment)
    if(!isValidChatangleTransactionMessageObject(transactionMessageObject)) { return }

    if(isEncrypted(transactionMessageObject)) {
        return chatanglePayloadFromEncryptedTransaction(transaction, transactionMessageObject)
    }

    return chatanglePayloadFromUnencryptedTransaction(transaction, transactionMessageObject)
}

function isEncrypted(transactionMessageObject) {
    return !!transactionMessageObject.encryptedPayload
}

function isValidChatangleTransactionMessageObject(transactionMessageObject) {
    if(!transactionMessageObject) { return false }
    if(transactionMessageObject.app !== 'Chatangle') { return false }
    if(transactionMessageObject.apiVersion !== 1) { return false }

    return true
}

/// Throws
function channelNameFromTransaction(transaction) {
    const decodedChannelName = TryteEncoderDecoder.utf8StringFromTrytes(transaction.address).replace(/[\x00-\x1F\x7F-\x9F]/g, '') // strip basic control chars
    if(decodedChannelName.length === 0) {
        throw 'Invalid channel name found'
    }
    return decodedChannelName
}

function chatanglePayloadFromEncryptedTransaction(transaction, transactionMessageObject) {
    if(!transactionMessageObject.encryptedPayload) { return null }
    try {
        return {
            encryptedPayload: transactionMessageObject.encryptedPayload,
            channelName: channelNameFromTransaction(transaction),
            txHash: transaction.hash, // for reference purposes
            attachmentTimestamp: transaction.attachmentTimestamp
        }
    } catch(e) {
        console.warn(`${new Date().toISOString()}: received undecodable channel name from transaction.address: ${transaction.address} ; transaction.hash: ${transaction.hash}`)
        return null
    }
}

function chatanglePayloadFromUnencryptedTransaction(transaction, transactionMessageObject) {
    if(!transactionMessageObject.payload || !transactionMessageObject.payload.message) { return }
    if(transactionMessageObject.payload.message.length > 250) { return }
    if(transactionMessageObject.payload.message.trim().length === 0) { return }
    if(transactionMessageObject.payload.name && transactionMessageObject.payload.name.length > 50) { return }

    let payload = transactionMessageObject.payload
    payload['message'] = payload['message'].trim()
    payload['txHash'] = transaction.hash // for reference purposes
    payload['attachmentTimestamp'] = transaction.attachmentTimestamp

    try {
        payload['channelName'] = channelNameFromTransaction(transaction)
    } catch(e) {
        console.warn(`${new Date().toISOString()}: received undecodable channel name from transaction.address: ${transaction.address} ; transaction.hash: ${transaction.hash}`)
        return null
    }

    return payload
}

function tryWebSocketConnection() {
    console.log(`${new Date().toISOString()}: Trying to create a new transaction stream WebSocket`)

    webSocketClient = new WebSocket(webSocketURL, {
        perMessageDeflate: false
    })

    webSocketClient.on('open', () => {
        console.log(`${new Date().toISOString()}: Opened transaction stream WebSocket`)
    })

    webSocketClient.on('message', data => {
        try {
            console.log(`${new Date().toISOString()}: got message`)
            const transaction = JSON.parse(Buffer.from(data).toString())
            const chatanglePayload = chatanglePayloadFromTransaction(transaction)
            if(!chatanglePayload) { return }
            transactionCallback(chatanglePayload)
        } catch(e) {}
    })

    webSocketClient.on('close', () => {
        console.warn(`${new Date().toISOString()}: The transaction stream WebSocket closed`)
        setTimeout(tryWebSocketConnection, 30000 + Math.random() * 10000)
    })

    webSocketClient.on('error', (error) => {
        console.warn(`${new Date().toISOString()}: The transaction stream WebSocket got an error: ${error}`)
    })

}

let transactionCallback = () => {}

function setTransactionCallback(callback) {
    transactionCallback = callback
}

module.exports = function(iotaTransactionStreamIP, iotaTransactionStreamPort, isIotaTransactionStreamSecured) {
    const webSocketProtocol = (isIotaTransactionStreamSecured === true || isIotaTransactionStreamSecured === 'true') ? 'wss' : 'ws'
    webSocketURL = `${webSocketProtocol}://${iotaTransactionStreamIP}:${iotaTransactionStreamPort}`

    tryWebSocketConnection()

    return {
        setTransactionCallback
    }
}
