import { snakeCase } from 'lodash';
import * as Container from '@arkecosystem/core-container';

export default class Repository {
  public database: any;
  public cache: any;
  public model: any;
  public query: any;
  public columns: Array<string> = [];

  constructor() {
    this.database = Container.resolvePlugin('database');
    this.cache = this.database.getCache();
    // @ts-ignore
    this.model = this.getModel();
    this.query = this.model.query();

    this.__mapColumns();
  }

  async _find(query) {
    return this.database.query.oneOrNone(query.toQuery());
  }

  async _findMany(query) {
    return this.database.query.manyOrNone(query.toQuery());
  }

  async _findManyWithCount(
    selectQuery,
    countQuery,
    { limit, offset, orderBy },
  ) {
    const { count } = await this._find(countQuery);

    if (this.columns.includes(orderBy[0])) {
      selectQuery.order(this.query[snakeCase(orderBy[0])][orderBy[1]]);
    }

    selectQuery.offset(offset).limit(limit);

    return {
      rows: await this._findMany(selectQuery),
      count: +count,
    };
  }

  _makeCountQuery() {
    return this.query.select('count(*) AS count').from(this.query);
  }

  _makeEstimateQuery() {
    return this.query
      .select('count(*) AS count')
      .from(`${this.model.getTable()} TABLESAMPLE SYSTEM (100)`);
  }

  _formatConditions(parameters) {
    const columns = this.model.getColumnSet().columns.map(column => ({
      name: column.name,
      prop: column.prop || column.name,
    }));

    return Object.keys(parameters)
      .filter(arg => this.columns.includes(arg))
      .reduce((items, item) => {
        const column = columns.find(
          value => value.name === item || value.prop === item,
        );

        column ? (items[column.name] = parameters[item]) : delete items[item];

        return items;
      }, {});
  }

  __mapColumns() {
    this.columns = [];

    for (const column of this.model.getColumnSet().columns) {
      this.columns.push(column.name);

      if (column.prop) {
        this.columns.push(column.prop);
      }
    }
  }
}
