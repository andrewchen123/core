import * as Hapi from "hapi";
import * as Boom from "boom";
import * as Container from '@arkecosystem/core-container';
import Controller from '../shared/controller';
import { blocksRepository, transactionsRepository } from '../../../repositories';

export default class PeersController extends Controller {
  protected blockchain: any;

  public constructor() {
    super();

    this.blockchain = Container.resolvePlugin('blockchain');
  }

  public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const allPeers = await this.blockchain.p2p.getPeers();

      let result = allPeers.sort((a, b) => a.delay - b.delay);
      result = request.query['os']
        ? result.filter(peer => peer.os === request.query['os'])
        : result;
      result = request.query['status']
        ? result.filter(peer => peer.status === request.query['status'])
        : result;
      result = request.query['port']
        ? result.filter(peer => peer.port === request.query['port'])
        : result;
      result = request.query['version']
        ? result.filter(peer => peer.version === request.query['version'])
        : result;
      result = result.slice(0, request.query['limit'] || 100);

      if (request.query['orderBy']) {
        const order = request.query['orderBy'].split(':');

        if (['port', 'status', 'os', 'version'].includes(order[0])) {
          result = order[1].toUpperCase() === 'ASC'
            ? result.sort((a, b) => a[order[0]] - b[order[0]])
            : result.sort((a, b) => a[order[0]] + b[order[0]]);
        }
      }

      return super.toPagination(
        request,
        { rows: result, count: result.length },
        'peer',
      );
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const peers = await this.blockchain.p2p.getPeers();
      const peer = peers.find(p => p.ip === request.params.ip);

      if (!peer) {
        return Boom.notFound('Peer not found');
      }

      return super.respondWithResource(request, peer, 'peer');
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async suspended(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const peers = Container.resolvePlugin('p2p').getSuspendedPeers();

      return super.respondWithCollection(
        request,
        Object.values(peers).map(peer => peer['peer']),
        'peer',
      );
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}
