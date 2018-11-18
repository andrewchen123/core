import * as Container from "@arkecosystem/core-container";
import * as Boom from "boom";
import * as Hapi from "hapi";
import Controller from "../shared/controller";

export default class AccountsController extends Controller {
  protected config: any;
  protected database: any;
  protected blockchain: any;

  public constructor() {
    super();

    this.config = Container.resolvePlugin("config");
    this.database = Container.resolvePlugin("database");
    this.blockchain = Container.resolvePlugin("blockchain");
  }

  public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const { rows } = await this.database.wallets.findAll({
        // @ts-ignore
        ...request.query,
        ...super.paginate(request),
      });

      return super.respondWith({
        accounts: super.toCollection(request, rows, "account"),
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const account = await this.database.wallets.findById(request.query.address);

      if (!account) {
        return super.respondWith("Account not found", true);
      }

      return super.respondWith({
        account: super.toResource(request, account, "account"),
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async balance(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const account = await this.database.wallets.findById(request.query.address);

      if (!account) {
        return super.respondWith({ balance: "0", unconfirmedBalance: "0" });
      }

      return super.respondWith({
        balance: account ? `${account.balance}` : "0",
        unconfirmedBalance: account ? `${account.balance}` : "0",
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async publicKey(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const account = await this.database.wallets.findById(request.query.address);

      if (!account) {
        return super.respondWith("Account not found", true);
      }

      return super.respondWith({ publicKey: account.publicKey });
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

  public async delegates(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const account = await this.database.wallets.findById(request.query.address);

      if (!account) {
        return super.respondWith("Address not found.", true);
      }

      if (!account.vote) {
        return super.respondWith(
          `Address ${request.query.address} hasn't voted yet.`,
          true,
        );
      }

      const delegate = await this.database.delegates.findById(account.vote);

      return super.respondWith({
        delegates: [super.toResource(request, delegate, "delegate")],
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async top(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      let accounts = this.database.wallets.top(super.paginate(request));

      accounts = accounts.rows.map((account) => ({
        address: account.address,
        balance: `${account.balance}`,
        publicKey: account.publicKey,
      }));

      return super.respondWith({ accounts });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async count(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const { count } = await this.database.wallets.findAll();

      return super.respondWith({ count });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}
