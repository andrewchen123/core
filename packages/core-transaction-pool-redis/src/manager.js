'use strict';

const Redis = require('ioredis')
const { slots } = require('@arkecosystem/client')
const { Transaction } = require('@arkecosystem/client').models
const pluginManager = require('@arkecosystem/core-plugin-manager')
const logger = pluginManager.get('logger')
const blockchain = pluginManager.get('blockchain')

let instance

/**
 * [exports description]
 * @type {[type]}
 */
module.exports = class Manager {
  /**
   * [getInstance description]
   * @return {[type]} [description]
   */
  static getInstance () {
    return instance
  }

  /**
   * [constructor description]
   * @param  {[type]} config [description]
   * @return {[type]}        [description]
   */
  constructor (config) {
    this.isConnected = false
    this.keyPrefix = config.keyPrefix
    this.counters = {}

    this.redis = config.enabled ? new Redis(config.redis) : null
    this.redisSub = config.enabled ? new Redis(config.redis) : null

    const that = this
    if (this.redis) {
      this.redis.on('connect', () => {
        logger.info('Redis connection established.')
        that.isConnected = true
        that.redis.config('set', 'notify-keyspace-events', 'Ex')
        that.redisSub.subscribe('__keyevent@0__:expired')
      })

      this.redisSub.on('message', (channel, message) => {
        // logger.debug(`Receive message ${message} from channel ${channel}`)
        this.removeTransaction(message.split('/')[3])
      })
    } else {
      logger.warn('Transaction pool is disabled in settings')
    }

    if (!instance) {
      instance = this
    }
    return instance
  }

  /**
   * [getPoolSize description]
   * @return {[type]} [description]
   */
  async getPoolSize () {
    return this.isConnected ? this.redis.llen(this.__getRedisOrderKey()) : -1
  }

  /**
   * [addTransaction description]
   * @param {[type]} object [description]
   */
  async addTransaction (object) {
    if (this.isConnected && object instanceof Transaction) {
      try {
        await this.redis.hmset(this.__getRedisTransactionKey(object.id), 'serialized', object.serialized.toString('hex'), 'timestamp', object.data.timestamp, 'expiration', object.data.expiration, 'senderPublicKey', object.data.senderPublicKey, 'timelock', object.data.timelock, 'timelocktype', object.data.timelocktype)
        await this.redis.rpush(this.__getRedisOrderKey(), object.id)

        if (object.data.expiration > 0) {
          await this.redis.expire(this.__getRedisTransactionKey(object.id), object.data.expiration - object.data.timestamp)
        }
      } catch (error) {
        logger.error('Error adding transaction to transaction pool error', error, error.stack)
      }
    }
  }

  /**
   * [removeTransaction description]
   * @param  {[type]} txID [description]
   * @return {[type]}      [description]
   */
  async removeTransaction (txID) {
    await this.redis.lrem(this.__getRedisOrderKey(), 1, txID)
    await this.redis.del(this.__getRedisTransactionKey(txID))
  }

  /**
   * [removeTransactions description]
   * @param  {[type]} transactions [description]
   * @return {[type]}              [description]
   */
  async removeTransactions (transactions) {
    try {
      for (let transaction of transactions) {
        await this.removeTransaction(transaction.id)
      }
    } catch (error) {
      logger.error(`Error removing forged transactions from pool ${error.stack}`)
    }
  }

  /**
   * [getTransactions description]
   * @param  {[type]} start [description]
   * @param  {[type]} size  [description]
   * @return {[type]}       [description]
   */
  async getTransactions (start, size) {
    if (this.isConnected) {
      try {
        const transactionIds = await this.redis.lrange(this.__getRedisOrderKey(), start, start + size - 1)
        let retList = []
        for (const id of transactionIds) {
          const serTrx = await this.redis.hmget(this.__getRedisTransactionKey(id), 'serialized')
          serTrx ? retList.push(serTrx[0]) : await this.removeTransaction(id)
        }
        return retList
      } catch (error) {
        logger.error('Get Transactions items from redis pool: ', error)
        logger.error(error.stack)
      }
    }
  }

  /**
   * [getTransactionsForForging description]
   * @param  {[type]} start [description]
   * @param  {[type]} size  [description]
   * @return {[type]}       [description]
   */
  async getTransactionsForForging (start, size) {
    if (this.isConnected) {
      try {
        let transactionIds = await this.redis.lrange(this.__getRedisOrderKey(), start, start + size - 1)
        transactionIds = await this.__checkIfForged(transactionIds)
        let retList = []
        for (const id of transactionIds) {
          const transaction = await this.redis.hmget(this.__getRedisTransactionKey(id), 'serialized', 'expired', 'timelock', 'timelocktype')
          if (!transaction[0]) {
            await this.removeTransaction(id)
            break
          }
          if (transaction[2]) { // timelock is defined
            const actions = {
              0: () => { // timestamp lock defined
                if (parseInt(transaction[2]) <= slots.getTime()) {
                  logger.debug(`Timelock for ${id} released timestamp=${transaction[2]}`)
                  retList.push(transaction[0])
                }
              },
              1: () => { // block height time lock
                if (parseInt(transaction[2]) <= blockchain.getInstance().getState().lastBlock.data.height) {
                  logger.debug(`Timelock for ${id} released block height=${transaction[2]}`)
                  retList.push(transaction[0])
                }
              }
            }
            actions[parseInt(transaction[3])]()
          } else {
            retList.push(transaction[0])
          }
        }
        return retList
      } catch (error) {
        logger.error('Get transactions for forging from redis list: ', error)
        logger.error(error.stack)
      }
    }
  }

  /**
   * [getTransaction description]
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  async getTransaction (id) {
    if (this.isConnected) {
      const serialized = await this.redis.hget(this.__getRedisTransactionKey(id), 'serialized')
      if (serialized) {
        return Transaction.fromBytes(serialized)
      } else {
        return 'Error: Non existing transaction'
      }
    }
  }

  // Checks if any of transactions for forging from pool was already forged and removes them from pool
  // It returns only the ids of transactions that have yet to be forged
  /**
   * [__checkIfForged description]
   * @param  {[type]} transactionIds [description]
   * @return {[type]}                [description]
   */
  async __checkIfForged (transactionIds) {
    const forgedIds = await blockchain.getInstance().getDb().getForgedTransactionsIds(transactionIds)
    forgedIds.forEach(element => this.removeTransaction(element))
    return transactionIds.filter(id => forgedIds.indexOf(id) === -1)
  }

  /**
   * [__getRedisTransactionKey description]
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  __getRedisTransactionKey (id) {
    return `${this.keyPrefix}/tx/${id}`
  }

  /**
   * [__getRedisOrderKey description]
   * @return {[type]} [description]
   */
  __getRedisOrderKey () {
    return `${this.keyPrefix}/order`
  }
}
