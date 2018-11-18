import * as Container from "@arkecosystem/core-container";
import * as Boom from "boom";
import * as Hapi from "hapi";
import Controller from "../shared/controller";

export default class PeersController extends Controller {
  protected blockchain: any;
  protected p2p: any;

  public constructor() {
    super();

    this.blockchain = Container.resolvePlugin("blockchain");
    this.p2p = Container.resolvePlugin("p2p");
  }

  public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const allPeers = await this.p2p.getPeers();

      if (!allPeers) {
        return super.respondWith("No peers found", true);
      }

      let peers = allPeers
        .map((peer) => {
          // just use 'OK' status for API instead of p2p http status codes
          peer.status = peer.status === 200 ? "OK" : peer.status;
          return peer;
        })
        .sort((a, b) => a.delay - b.delay);
      peers = request.query.os
        ? allPeers.filter((peer) => peer.os === request.query.os)
        : peers;
      peers = request.query.status
        ? allPeers.filter((peer) => peer.status === request.query.status)
        : peers;
      peers = request.query.port
        ? allPeers.filter((peer) => peer.port === request.query.port)
        : peers;
      peers = request.query.version
        ? allPeers.filter((peer) => peer.version === request.query.version)
        : peers;
      peers = peers.slice(0, request.query.limit || 100);

      if (request.query.orderBy) {
        const order = request.query.orderBy.split(":");
        if (["port", "status", "os", "version"].includes(order[0])) {
          peers = order[1].toUpperCase() === "ASC"
            ? peers.sort((a, b) => a[order[0]] - b[order[0]])
            : peers.sort((a, b) => a[order[0]] + b[order[0]]);
        }
      }

      return super.respondWith({
        peers: super.toCollection(
          request,
          peers.map((peer) => peer.toBroadcastInfo()),
          "peer",
        ),
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      const peers = await this.p2p.getPeers();
      if (!peers) {
        return super.respondWith("No peers found", true);
      }

      const peer = peers.find(
        (elem) => elem.ip === request.query.ip && +elem.port === +request.query.port,
      );

      if (!peer) {
        return super.respondWith(
          `Peer ${request.query.ip}:${request.query.port} not found`,
          true,
        );
      }

      return super.respondWith({
        peer: super.toResource(request, peer.toBroadcastInfo(), "peer"),
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }

  public async version(request: Hapi.Request, h: Hapi.ResponseToolkit) {
    try {
      return super.respondWith({
        version: Container.resolveOptions("blockchain").version,
      });
    } catch (error) {
      return Boom.badImplementation(error);
    }
  }
}
