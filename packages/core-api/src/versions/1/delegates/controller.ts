import * as Container from "@arkecosystem/core-container";
import { slots } from "@arkecosystem/crypto";
import * as Boom from "boom";
import * as Hapi from "hapi";
import Controller from "../shared/controller";

export default class DelegatesController extends Controller {
  protected blockchain: any;
  protected config: any;
  protected database: any;

  public constructor() {
    super();

    this.blockchain = Container.resolvePlugin("blockchain");
    this.config = Container.resolvePlugin("config");
    this.database = Container.resolvePlugin("database");
  }

  public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const { count, rows } = await this.database.delegates.paginate({
        // @ts-ignore
        ...request.query,
        ...{
          offset: request.query.offset || 0,
          limit: request.query.limit || 51,
        },
      });

      return super.respondWith({
        delegates: super.toCollection(request, rows, "delegate"),
        totalCount: count,
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      if (!request.query.publicKey && !request.query.username) {
        return super.respondWith("Delegate not found", true);
      }

      const delegate = await this.database.delegates.findById(
        request.query.publicKey || request.query.username,
      );

      if (!delegate) {
        return super.respondWith("Delegate not found", true);
      }

      return super.respondWith({
        delegate: super.toResource(request, delegate, "delegate"),
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async count(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const { count } = await this.database.delegates.findAll();

      return super.respondWith({ count });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const query = {
        username: request.query.q,
      };
      const { rows } = await this.database.delegates.search({
        ...query,
        ...super.paginate(request),
      });

      return super.respondWith({
        delegates: super.toCollection(request, rows, "delegate"),
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async voters(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const delegate = await this.database.delegates.findById(request.query.publicKey);

      if (!delegate) {
        return super.respondWith({
          accounts: [],
        });
      }

      const accounts = await this.database.wallets.findAllByVote(delegate.publicKey);

      return super.respondWith({
        accounts: super.toCollection(request, accounts.rows, "voter"),
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async fee(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      return super.respondWith({
        fee: this.config.getConstants(this.blockchain.getLastBlock().data.height).fees
          .delegateRegistration,
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async forged(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const wallet = this.database.walletManager.findByPublicKey(
        request.query.generatorPublicKey,
      );

      return super.respondWith({
        fees: Number(wallet.forgedFees),
        rewards: Number(wallet.forgedRewards),
        forged: Number(wallet.forgedFees) + Number(wallet.forgedRewards),
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async nextForgers(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const lastBlock = this.blockchain.getLastBlock();
      const limit = request.query.limit || 10;

      const delegatesCount = this.config.getConstants(lastBlock).activeDelegates;
      const currentSlot = slots.getSlotNumber(lastBlock.data.timestamp);

      let activeDelegates = await this.database.getActiveDelegates(
        lastBlock.data.height,
      );
      activeDelegates = activeDelegates.map((delegate) => delegate.publicKey);

      const nextForgers = [];
      for (let i = 1; i <= delegatesCount && i <= limit; i++) {
        const delegate = activeDelegates[(currentSlot + i) % delegatesCount];

        if (delegate) {
          nextForgers.push(delegate);
        }
      }

      return super.respondWith({
        currentBlock: lastBlock.data.height,
        currentSlot,
        delegates: nextForgers,
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}
