import { Type } from '@nestjs/common';
import { AuthUserClass } from 'src/commons/auth/authUser.decorator';
import { UserRole } from 'src/models/users/user.entity';
import { typeormQueryMany, typeormQueryOne } from 'src/queryHelper';
import { DataSource, FindOneOptions, In } from 'typeorm';
import { transformTypeOrmId } from '../utils/transformTypeOrmId';
import { CrudModuleOptions } from './crud-module-interfaces';

export function CrudService<T>(options: CrudModuleOptions) {
  abstract class BaseResolverHost {
    constructor(private dataSource: DataSource) {}

    async findOne({
      entity,
      dto,
      where,
      authUser,
      forcedPublicFilter,
    }: {
      entity?: Type<unknown>;
      dto: Type<unknown>;
      forcedPublicFilter: any;
      where: FindOneOptions;
      authUser: AuthUserClass;
    }): Promise<any> {
      const repository = this.dataSource.getRepository(
        entity || options.entity,
      );
      const node = await typeormQueryOne({
        repository: repository,
        dto,
        where,
        authUser,
        alias: options.entity.name.toLowerCase(),
        forcedPublicFilter: forcedPublicFilter,
      });
      return node;
    }

    async findMany({
      entity,
      properties,
      select,
      dto,
      filter,
      sorting,
      paging,
      defaultResults,
      maxPublicResults,
      defaultSorting,
      forcedPublicFilter,
      authUser = { id: '', role: UserRole.USER },
      showDeleted,
      withTotalCount,
      cache,
    }: {
      entity: Type<unknown>;
      properties: any;
      dto: Type<unknown>;
      defaultResults: number;
      maxPublicResults: number;
      defaultSorting: any;
      forcedPublicFilter: any;
      filter?: any;
      sorting?: any;
      paging?: any;
      select: string[];
      showDeleted?: boolean;
      authUser: AuthUserClass;
      withTotalCount?: boolean;
      cache?: number;
    }) {
      const repository = this.dataSource.getRepository(
        entity || options.entity,
      );
      return await typeormQueryMany({
        properties,
        repository: repository,
        dto: dto,
        defaultResults,
        maxPublicResults,
        defaultSorting,
        forcedPublicFilter,
        select,
        filter,
        sorting,
        paging,
        authUser,
        showDeleted,
        alias: options.entity.name.toLowerCase(),
        withTotalCount,
        cache,
      });
    }

    async createOne(data, properties): Promise<any> {
      const repository = this.dataSource.getRepository(options.entity);
      data = transformTypeOrmId(data, properties);
      const newEntity = repository.create(data);
      return await repository.save(newEntity);
    }

    async updateOne(id, data, properties): Promise<any> {
      const repository = this.dataSource.getRepository(options.entity);
      data = transformTypeOrmId(data, properties);
      const entity = await repository.findOneOrFail({ where: { id } });
      return repository.save(Object.assign(entity, data));
    }

    async softDeleteOne(id: string) {
      const repository = this.dataSource.getRepository(options.entity);
      return await repository.softDelete(id);
    }
    async softDeleteMany(ids: string[]) {
      const repository = this.dataSource.getRepository(options.entity);
      return await repository.softDelete({ id: In(ids) });
    }
    async restoreOne(id: string) {
      const repository = this.dataSource.getRepository(options.entity);
      return await repository.restore(id);
    }
    async restoreMany(ids: string[]) {
      const repository = this.dataSource.getRepository(options.entity);
      return await repository.restore({ id: In(ids) });
    }
    async finalDeleteOne(id: string) {
      const repository = this.dataSource.getRepository(options.entity);

      await repository.delete(id);
      return { id: 'removed' };
    }
    async finalDeleteMany(ids: string[]) {
      const repository = this.dataSource.getRepository(options.entity);
      return await repository.delete({ id: In(ids) });
    }
  }
  return BaseResolverHost as any;
}
