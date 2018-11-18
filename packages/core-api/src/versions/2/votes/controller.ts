import * as Hapi from "hapi";
import * as Boom from "boom";
import { constants } from '@arkecosystem/crypto';
import Controller from '../shared/controller';
import { blocksRepository, transactionsRepository } from '../../../repositories';

export default class VotesController extends Controller {
  public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const transactions = await transactionsRepository.findAllByType(
        constants.TRANSACTION_TYPES.VOTE,
        {
          // @ts-ignore
          ...request.query,
          ...super.paginate(request),
        },
      );

      return super.toPagination(request, transactions, 'transaction');
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const transaction = await transactionsRepository.findByTypeAndId(
        constants.TRANSACTION_TYPES.VOTE,
        request.params.id,
      );

      if (!transaction) {
        return Boom.notFound('Vote not found');
      }

      return super.respondWithResource(request, transaction, 'transaction');
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}
