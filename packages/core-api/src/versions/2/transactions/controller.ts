import * as Container from "@arkecosystem/core-container";
import * as Boom from "boom";
import * as Hapi from "hapi";
import * as pluralize from "pluralize";
import { transactionsRepository } from "../../../repositories";
import Controller from "../shared/controller";

import { TransactionGuard } from "@arkecosystem/core-transaction-pool";
import { constants } from "@arkecosystem/crypto";

export default class TransactionsController extends Controller {
  protected blockchain: any;
  protected config: any;
  protected logger: any;
  protected transactionPool: any;

  public constructor() {
    super();

    this.blockchain = Container.resolvePlugin("blockchain");
    this.config = Container.resolvePlugin("config");
    this.logger = Container.resolvePlugin("logger");
    this.transactionPool = Container.resolvePlugin("transactionPool");
  }

  public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const transactions = await transactionsRepository.findAll({
        // @ts-ignore
        ...request.query,
        ...super.paginate(request),
      });

      return super.toPagination(request, transactions, "transaction");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async store(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      if (!this.transactionPool.options.enabled) {
        return Boom.serverUnavailable('Transaction pool is disabled.')
      }

      const guard = new TransactionGuard(this.transactionPool)

      const result = await guard.validate(request.payload.transactions)

      if (result.broadcast.length > 0) {
        Container.resolvePlugin('p2p').broadcastTransactions(result.broadcast)
      }

      return {
        data: {
          accept: result.accept.map(t => t.id),
          broadcast: result.broadcast.map(t => t.id),
          excess: result.excess.map(t => t.id),
          invalid: result.invalid.map(t => t.id),
        },
        errors: result.errors,
      }
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const transaction = await transactionsRepository.findById(request.params.id);

      if (!transaction) {
        return Boom.notFound("Transaction not found");
      }

      return super.respondWithResource(request, transaction, "transaction");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async unconfirmed(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      if (!this.transactionPool.options.enabled) {
        return Boom.serverUnavailable("Transaction pool is disabled.");
      }

      const pagination = super.paginate(request);

      let transactions = this.transactionPool.getTransactions(
        pagination.offset,
        pagination.limit,
      );
      transactions = transactions.map((transaction) => ({
        serialized: transaction,
      }));

      return super.toPagination(
        request,
        {
          count: this.transactionPool.getPoolSize(),
          rows: transactions,
        },
        "transaction",
      );
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async showUnconfirmed(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      if (!this.transactionPool.options.enabled) {
        return Boom.serverUnavailable("Transaction pool is disabled.");
      }

      let transaction = this.transactionPool.getTransaction(request.params.id);

      if (!transaction) {
        return Boom.notFound("Transaction not found");
      }

      transaction = { serialized: transaction.serialized };

      return super.respondWithResource(request, transaction, "transaction");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const transactions = await transactionsRepository.search({
        // @ts-ignore
        ...request.query,
        // @ts-ignore
        ...request.payload,
        ...super.paginate(request),
      });

      return super.toPagination(request, transactions, "transaction");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async types(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      return {
        data: constants.TRANSACTION_TYPES,
      };
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async fees(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      return {
        data: this.config.getConstants(this.blockchain.getLastHeight()).fees,
      };
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}
