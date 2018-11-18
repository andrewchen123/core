import * as Container from "@arkecosystem/core-container";
import * as Boom from "boom";
import * as Hapi from "hapi";
import { transactionsRepository } from "../../../repositories";
import Controller from "../shared/controller";

export default class TransactionsController extends Controller {
  protected transactionPool: any;

  public constructor() {
    super();

    this.transactionPool = Container.resolvePlugin("transactionPool");
  }

  public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const { count, rows } = await transactionsRepository.findAllLegacy({
        // @ts-ignore
        ...request.query,
        ...super.paginate(request),
      });

      if (!rows) {
        return super.respondWith("No transactions found", true);
      }

      return super.respondWith({
        transactions: super.toCollection(request, rows, "transaction"),
        count,
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const result = await transactionsRepository.findById(request.query.id);

      if (!result) {
        return super.respondWith("No transactions found", true);
      }

      return super.respondWith({
        transaction: super.toResource(request, result, "transaction"),
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async unconfirmed(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const pagination = super.paginate(request);

      let transactions = this.transactionPool.getTransactions(
        pagination.offset,
        pagination.limit,
      );
      transactions = transactions.map((transaction) => ({
        serialized: transaction,
      }));

      return super.respondWith({
        transactions: super.toCollection(request, transactions, "transaction"),
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async showUnconfirmed(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const transaction = this.transactionPool.getTransaction(request.query.id);

      if (!transaction) {
        return super.respondWith("Transaction not found", true);
      }

      return super.respondWith({
        transaction: super.toResource(
          request,
          {
            serialized: transaction.serialized,
          },
          "transaction",
        ),
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}
