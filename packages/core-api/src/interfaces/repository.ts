import * as Hapi from "hapi";

export interface IRepository {
  database: any;
  cache: any;
  model: any;
  query: any;
  columns: Array<string>;

  getModel(): string;
}
