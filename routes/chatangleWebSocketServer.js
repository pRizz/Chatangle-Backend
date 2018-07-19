/*!
 * Chatangle Backend
 * Copyright(c) 2017 Peter Ryszkiewicz
 * MIT Licensed
 */

const WebSocket = require('ws')
const _ = require('lodash')

let messageCache = require('../lib/RecentMessageCache')
let webSocketServer = null

function heartbeat() {
    this.isAlive = true
}

function payloadFromCachedMessages() {
    return messageCache.getMessages()
}

function sendCachedMessagesToClient(webSocketClient) {
    const object = {
        type: 'cachedMessages',
        payload: payloadFromCachedMessages()
    }
    console.log(`${new Date().toISOString()}: sending cached messages to client`)
    webSocketClient.send(JSON.stringify(object))
}

function broadcastClientCount() {
    broadcastObjectToClients({
        clientCount: webSocketServer.clients.size
    }, 'clientCount')
}

const broadcastClientCountDebounced = _.debounce(broadcastClientCount, 300, {
    maxWait: 15000
})

function broadcastObjectToClients(objectToBroadcast, type) {
    const object = {
        type: type,
        payload: objectToBroadcast
    }
    console.log(`${new Date().toISOString()}: `, JSON.stringify(object))
    webSocketServer.broadcast(JSON.stringify(object))
}

function setMessageCache(newMessageCache) {
    messageCache = newMessageCache
}

let heartbeatInterval

function initializeServer(webSocketServerPort) {
    if(webSocketServer) {
        console.log('Already running!')
        return
    }

    webSocketServer = new WebSocket.Server({
        port: webSocketServerPort
    })

    webSocketServer.on('connection', (webSocketClient, request) => {
        console.log(`${new Date().toISOString()}: received WebSocket connection`)

        heartbeat.apply(webSocketClient)
        webSocketClient.on('pong', heartbeat)
        webSocketClient.on('message', message => {})
        webSocketClient.on('close', broadcastClientCountDebounced)
        webSocketClient.on('error', (error) => {}) // TODO: handle

        broadcastClientCountDebounced()
        sendCachedMessagesToClient(webSocketClient)
    })

    webSocketServer.on('close', error => {
        console.error(`${new Date().toISOString()}: got close, `, error)
    })

    webSocketServer.on('error', error => {
        console.error(`${new Date().toISOString()}: got error, `, error)
    })

    webSocketServer.broadcast = function(data) {
        webSocketServer.clients.forEach(client => {
            if(client.readyState !== WebSocket.OPEN) { return }
            client.send(data)
        })
    }

    heartbeatInterval = setInterval(() => {
        webSocketServer.clients.forEach(webSocketClient => {
            if(webSocketClient.isAlive === false) {
                return webSocketClient.terminate()
            }
            webSocketClient.isAlive = false
            webSocketClient.ping('', false, true)
        })
    }, 30010)
}

function start({ webSocketServerPort }) {
    initializeServer(webSocketServerPort)

    return {
        broadcastObjectToClients,
        setMessageCache,
        stop
    }
}

async function stop() {
    return new Promise((resolve, reject) => {
        if(!webSocketServer) {
            return reject('No server to stop')
        }
        webSocketServer.close((error) => {
            if(error) { return reject(error) }
            resolve()
        })
        webSocketServer = null
    })
}

module.exports = {
    start
}