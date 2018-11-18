import * as Hapi from "hapi";
import * as Boom from "boom";
import { bignumify } from '@arkecosystem/core-utils';
import * as Container from '@arkecosystem/core-container';
import Controller from '../shared/controller';
import { blocksRepository } from '../../../repositories';

export default class BlocksController extends Controller {
  protected blockchain: any;
  protected config: any;

  public constructor() {
    super();

    this.blockchain = Container.resolvePlugin('blockchain');
    this.config = Container.resolvePlugin('config');
  }

  public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const { count, rows } = await blocksRepository.findAll({
        // @ts-ignore
        ...request.query,
        ...super.paginate(request),
      });

      if (!rows) {
        return super.respondWith('No blocks found', true);
      }

      return super.respondWith({
        blocks: super.toCollection(request, rows, 'block'),
        count,
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const block = await blocksRepository.findById(request.query['id']);

      if (!block) {
        return super.respondWith(
          `Block with id ${request.query['id']} not found`,
          true,
        );
      }

      return super.respondWith({
        block: super.toResource(request, block, 'block'),
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async epoch(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      return super.respondWith({
        epoch: this.config.getConstants(this.blockchain.getLastBlock().data.height).epoch,
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async height(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const block = this.blockchain.getLastBlock();

      return super.respondWith({ height: block.data.height, id: block.data.id });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async nethash(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      return super.respondWith({ nethash: this.config.network.nethash });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async fee(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      return super.respondWith({
        fee: this.config.getConstants(this.blockchain.getLastBlock().data.height).fees
          .transfer,
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async fees(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const fees = this.config.getConstants(this.blockchain.getLastBlock().data.height).fees;

      return super.respondWith({
        fees: {
          send: fees.transfer,
          vote: fees.vote,
          secondsignature: fees.secondSignature,
          delegate: fees.delegateRegistration,
          multisignature: fees.multiSignature,
        },
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async milestone(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      return super.respondWith({
        milestone: Math.floor(this.blockchain.getLastBlock().data.height / 3000000),
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async reward(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      return super.respondWith({
        reward: this.config.getConstants(this.blockchain.getLastBlock().data.height).reward,
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async supply(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const lastBlock = this.blockchain.getLastBlock();
      const constants = this.config.getConstants(lastBlock.data.height);
      const rewards = bignumify(constants.reward).times(
        lastBlock.data.height - constants.height,
      );

      return super.respondWith({
        supply: +bignumify(this.config.genesisBlock.totalAmount)
          .plus(rewards)
          .toFixed(),
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async status(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const lastBlock = this.blockchain.getLastBlock();
      const constants = this.config.getConstants(lastBlock.data.height);
      const rewards = bignumify(constants.reward).times(
        lastBlock.data.height - constants.height,
      );

      return super.respondWith({
        epoch: constants.epoch,
        height: lastBlock.data.height,
        fee: constants.fees.transfer,
        milestone: Math.floor(lastBlock.data.height / 3000000),
        nethash: this.config.network.nethash,
        reward: constants.reward,
        supply: +bignumify(this.config.genesisBlock.totalAmount)
          .plus(rewards)
          .toFixed(),
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}
