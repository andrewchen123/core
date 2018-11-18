import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Container from '@arkecosystem/core-container';
import Controller from '../shared/controller';

export default class SignaturesController extends Controller{
  protected blockchain: any;
  protected config: any;

  public constructor() {
    super();

    this.blockchain = Container.resolvePlugin('blockchain');
    this.config = Container.resolvePlugin('config');
  }

  public async fee(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const height: number = this.blockchain.getLastBlock().data.height;

      return super.respondWith({
        fee: this.config.getConstants(height).fees.secondSignature,
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}
