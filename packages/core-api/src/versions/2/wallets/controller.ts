import * as Container from "@arkecosystem/core-container";
import * as Boom from "boom";
import * as Hapi from "hapi";
import { blocksRepository, transactionsRepository } from "../../../repositories";
import Controller from "../shared/controller";

export default class WalletsController extends Controller {
  protected database: any;

  public constructor() {
    super();

    this.database = Container.resolvePlugin("database");
  }

  public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const wallets = await this.database.wallets.findAll({
        // @ts-ignore
        ...request.query,
        ...super.paginate(request),
      });

      // Object.assign(request.query, super.paginate(request))

      return super.toPagination(request, wallets, "wallet");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async top(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const wallets = await this.database.wallets.top(super.paginate(request));

      return super.toPagination(request, wallets, "wallet");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const wallet = await this.database.wallets.findById(request.params.id);

      if (!wallet) {
        return Boom.notFound("Wallet not found");
      }

      return super.respondWithResource(request, wallet, "wallet");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async transactions(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const wallet = await this.database.wallets.findById(request.params.id);

      if (!wallet) {
        return Boom.notFound("Wallet not found");
      }

      const transactions = await transactionsRepository.findAllByWallet(wallet, {
        // @ts-ignore
        ...request.query,
        ...request.params,
        ...super.paginate(request),
      });

      return super.toPagination(request, transactions, "transaction");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async transactionsSent(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const wallet = await this.database.wallets.findById(request.params.id);

      if (!wallet) {
        return Boom.notFound("Wallet not found");
      }

      // NOTE: We unset this value because it otherwise will produce a faulty SQL query
      delete request.params.id;

      const transactions = await transactionsRepository.findAllBySender(
        wallet.publicKey,
        {
          // @ts-ignore
          ...request.query,
          ...request.params,
          ...super.paginate(request),
        },
      );

      return super.toPagination(request, transactions, "transaction");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async transactionsReceived(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const wallet = await this.database.wallets.findById(request.params.id);

      if (!wallet) {
        return Boom.notFound("Wallet not found");
      }

      // NOTE: We unset this value because it otherwise will produce a faulty SQL query
      delete request.params.id;

      const transactions = await transactionsRepository.findAllByRecipient(
        wallet.address,
        {
          // @ts-ignore
          ...request.query,
          ...request.params,
          ...super.paginate(request),
        },
      );

      return super.toPagination(request, transactions, "transaction");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async votes(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const wallet = await this.database.wallets.findById(request.params.id);

      if (!wallet) {
        return Boom.notFound("Wallet not found");
      }

      // NOTE: We unset this value because it otherwise will produce a faulty SQL query
      delete request.params.id;

      const transactions = await transactionsRepository.allVotesBySender(
        wallet.publicKey,
        {
          ...request.params,
          ...super.paginate(request),
        },
      );

      return super.toPagination(request, transactions, "transaction");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const wallets = await this.database.wallets.search({
        // @ts-ignore
        ...request.payload,
        // @ts-ignore
        ...request.query,
        ...super.paginate(request),
      });

      return super.toPagination(request, wallets, "wallet");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}
