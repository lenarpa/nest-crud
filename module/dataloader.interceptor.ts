import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import DataLoader from 'dataloader';
import { Observable } from 'rxjs';
import { User } from 'src/models/users/user.entity';
import { DataSource, In } from 'typeorm';
import { CrudModuleOptions } from './crud-module-interfaces';

export function DataLoaderInterceptor(properties: any): any {
  @Injectable()
  class DataLoaderInterceptor implements NestInterceptor {
    constructor(private dataSource: DataSource) {}

    async intercept(
      context: ExecutionContext,
      next: CallHandler,
    ): Promise<Observable<any>> {
      const gqlContext = GqlExecutionContext.create(context);
      const req = gqlContext.getContext().req;
      req.loaders = {};

      properties.map((property) => {
        if (property.extensions.relation && !req.loaders[property.name]) {
          const loaderName = `${property.extensions.relation[0].name.toLowerCase()}Loader`;
          req.loaders[loaderName] = new DataLoader(async (ids: string[]) => {
            const repository = this.dataSource.getRepository(
              property.extensions.relation[0],
            );
            const nodes = await repository.find({ where: { id: In(ids) } });
            return (
              ids.map((id) => nodes.find((result) => result.id == id)) || null
            );
          });
        }
      });
      return next.handle();
    }
  }
  return DataLoaderInterceptor;
}
