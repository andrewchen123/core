import * as Container from "@arkecosystem/core-container";
import * as Boom from "boom";
import * as Hapi from "hapi";
import orderBy from "lodash/orderBy";
import { blocksRepository, transactionsRepository } from "../../../repositories";
import Controller from "../shared/controller";

export default class DelegatesController extends Controller {
  protected database: any;

  public constructor() {
    super();

    this.database = Container.resolvePlugin("database");
  }

  public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const delegates = await this.database.delegates.paginate({
        // @ts-ignore
        ...request.query,
        ...super.paginate(request),
      });

      return super.toPagination(request, delegates, "delegate");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const delegate = await this.database.delegates.findById(request.params.id);

      if (!delegate) {
        return Boom.notFound("Delegate not found");
      }

      return super.respondWithResource(request, delegate, "delegate");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const delegates = await this.database.delegates.search({
        // @ts-ignore
        ...request.payload,
        // @ts-ignore
        ...request.query,
        ...super.paginate(request),
      });

      return super.toPagination(request, delegates, "delegate");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async blocks(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const delegate = await this.database.delegates.findById(request.params.id);

      if (!delegate) {
        return Boom.notFound("Delegate not found");
      }

      const blocks = await blocksRepository.findAllByGenerator(
        delegate.publicKey,
        super.paginate(request),
      );

      return super.toPagination(request, blocks, "block");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async voters(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const delegate = await this.database.delegates.findById(request.params.id);

      if (!delegate) {
        return Boom.notFound("Delegate not found");
      }

      const wallets = await this.database.wallets.findAllByVote(
        delegate.publicKey,
        super.paginate(request),
      );

      return super.toPagination(request, wallets, "wallet");
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async voterBalances(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const delegate = await this.database.delegates.findById(request.params.id);

      if (!delegate) {
        return Boom.notFound("Delegate not found");
      }

      const wallets = await this.database.wallets
        .all()
        .filter((wallet) => wallet.vote === delegate.publicKey);

      const voters = {};
      orderBy(wallets, ["balance"], ["desc"]).forEach((wallet) => {
        voters[wallet.address] = +wallet.balance.toFixed();
      });

      return { data: voters };
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}
