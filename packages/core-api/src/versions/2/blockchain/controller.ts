import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Container from '@arkecosystem/core-container';
import { bignumify } from '@arkecosystem/core-utils';
import Controller from '../shared/controller';

export default class BlockchainController extends Controller {
  protected config: any;
  protected blockchain: any;

  public constructor() {
    super();

    this.config = Container.resolvePlugin('config');
    this.blockchain = Container.resolvePlugin('blockchain');
  }

  public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const lastBlock = this.blockchain.getLastBlock();

      const constants = this.config.getConstants(lastBlock.data.height);
      const rewards = bignumify(constants.reward).times(
        lastBlock.data.height - constants.height,
      );

      return {
        data: {
          block: {
            height: lastBlock.data.height,
            id: lastBlock.data.id,
          },
          supply: +bignumify(this.config.genesisBlock.totalAmount)
            .plus(rewards)
            .toFixed(),
        },
      };
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}
