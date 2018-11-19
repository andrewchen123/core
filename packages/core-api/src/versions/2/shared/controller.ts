import * as Boom from "boom";
import * as Hapi from "hapi";
import Transformer from "../../../services/transformer";

export default class Controller {
  protected paginate(request: Hapi.Request) {
    const pagination = {
      // @ts-ignore
      offset: (request.query.page - 1) * request.query.limit || 0,
      // @ts-ignore
      limit: request.query.limit || 100,
    };

    // @ts-ignore
    if (request.query.offset) {
      // @ts-ignore
      pagination.offset = request.query.offset;
    }

    return pagination;
  }

  protected respondWithResource(request, data, transformer) {
    return data
      ? { data: Transformer.toResource(request, data, transformer) }
      : Boom.notFound();
  }

  protected respondWithCollection(request, data, transformer) {
    return {
      data: Transformer.toCollection(request, data, transformer),
    };
  }

  protected toResource(request, data, transformer) {
    return Transformer.toResource(request, data, transformer);
  }

  protected toCollection(request, data, transformer) {
    return Transformer.toCollection(request, data, transformer);
  }

  protected toPagination(request, data, transformer) {
    return {
      results: Transformer.toCollection(request, data.rows, transformer),
      totalCount: data.count,
    };
  }
}
