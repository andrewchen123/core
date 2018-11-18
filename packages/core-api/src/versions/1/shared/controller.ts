import * as Boom from "boom";
import * as Hapi from "hapi";
import Transformer from "../../../services/transformer";

export default class Controller {
  protected paginate(request: Hapi.Request) {
    return {
      offset: request.query.offset || 0,
      limit: request.query.limit || 100,
    };
  }

  protected respondWith(data, error = false) {
    return error
      ? { error: data, success: false }
      : { ...data, success: true };
  }

  protected toResource(request, data, transformer) {
    return Transformer.toResource(request, data, transformer);
  }

  protected toCollection(request, data, transformer) {
    return Transformer.toCollection(request, data, transformer);
  }
}
