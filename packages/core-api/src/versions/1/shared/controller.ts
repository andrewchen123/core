import * as Boom from "boom";
import * as Hapi from "hapi";
import Transformer from "../../../services/transformer";

export default class Controller {
  protected paginate(request: Hapi.Request): any {
    return {
      // @ts-ignore
      offset: request.query.offset || 0,
      // @ts-ignore
      limit: request.query.limit || 100,
    };
  }

  protected respondWith(data, error = false): object {
    return error
      ? { error: data, success: false }
      : { ...data, success: true };
  }

  protected toResource(request, data, transformer): object {
    return Transformer.toResource(request, data, transformer);
  }

  protected toCollection(request, data, transformer): object {
    return Transformer.toCollection(request, data, transformer);
  }
}
