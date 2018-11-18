import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Container from '@arkecosystem/core-container';
import Controller from '../shared/controller';
import { transactionsRepository } from '../../../repositories';

export default class LoaderController extends Controller {
  protected blockchain: any;
  protected config: any;

  public constructor() {
    super();

    this.blockchain = Container.resolvePlugin('blockchain');
    this.config = Container.resolvePlugin('config');
  }

  public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      return { data: true };
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async status(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const lastBlock = this.blockchain.getLastBlock();

      return super.respondWith({
        loaded: this.blockchain.isSynced(),
        now: lastBlock ? lastBlock.data.height : 0,
        blocksCount:
          this.blockchain.p2p.getNetworkHeight() - lastBlock
            ? lastBlock.data.height
            : 0,
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async syncing(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const lastBlock = this.blockchain.getLastBlock();

      return super.respondWith({
        syncing: !this.blockchain.isSynced(),
        blocks: this.blockchain.p2p.getNetworkHeight() - lastBlock.data.height,
        height: lastBlock.data.height,
        id: lastBlock.data.id,
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async autoconfigure(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const feeStatisticsData = await transactionsRepository.getFeeStatistics();

      return super.respondWith({
        network: {
          nethash: this.config.network.nethash,
          token: this.config.network.client.token,
          symbol: this.config.network.client.symbol,
          explorer: this.config.network.client.explorer,
          version: this.config.network.pubKeyHash,
          ports: super.toResource(request, this.config, 'ports'),
          feeStatistics: super.toCollection(
            request,
            feeStatisticsData,
            'fee-statistics',
          ),
        },
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}
