/*!
 * Chatangle Backend
 * Copyright(c) 2017 Peter Ryszkiewicz
 * MIT Licensed
 */

const maxCachedMessageCount = 30

let cachedMessages = []

function addMessage(message) {
    cachedMessages.push(message)
    if(cachedMessages.length > maxCachedMessageCount) {
        cachedMessages.shift()
    }
}

function getMessages() {
    return cachedMessages
}

module.exports = {
    addMessage,
    getMessages
}