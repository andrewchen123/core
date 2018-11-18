import * as Hapi from "hapi";
import * as Boom from "boom";
import Controller from '../shared/controller';
import { blocksRepository, transactionsRepository } from '../../../repositories';

export default class BlocksController extends Controller {
  public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const blocks = await blocksRepository.findAll({
        // @ts-ignore
        ...request.query,
        ...super.paginate(request),
      });

      return super.toPagination(request, blocks, 'block');
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const block = await blocksRepository.findById(request.params.id);

      if (!block) {
        return Boom.notFound('Block not found');
      }

      return super.respondWithResource(request, block, 'block');
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async transactions(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const block = await blocksRepository.findById(request.params.id);

      if (!block) {
        return Boom.notFound('Block not found');
      }

      const transactions = await transactionsRepository.findAllByBlock(block.id, {
        // @ts-ignore
        ...request.query,
        ...super.paginate(request),
      });

      return super.toPagination(request, transactions, 'transaction');
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const blocks = await blocksRepository.search({
        // @ts-ignore
        ...request.payload,
        // @ts-ignore
        ...request.query,
        ...super.paginate(request),
      });

      return super.toPagination(request, blocks, 'block');
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}
