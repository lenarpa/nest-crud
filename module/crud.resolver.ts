import { Options, UseInterceptors } from '@nestjs/common';
import {
  Args,
  ArgsType,
  ID,
  Info,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from '@nestjs/graphql';
import { fieldsList } from 'graphql-fields-list';
import { Roles } from 'src/commons/access/roles.decorator';
import { AuthUser, AuthUserClass } from 'src/commons/auth/authUser.decorator';
import { FindManyArgs } from 'src/queryHelper';
import { FindOneArgs } from 'src/queryHelper/dtos/find-one-args.dto';
import { FindOneInput } from 'src/queryHelper/dtos/find-one-input.dto';
import { Paginated, PaginatedType } from '../../types/paginated.dto';
import { getPropertiesFromObjectClass } from '../utils/getPropertiesfromClass';
import { BaseFieldResolver } from './baseFieldResolver';
import { CrudModuleOptions } from './crud-module-interfaces';
import { ApplyInterceptors } from './crud.interceptors';
import { DataLoaderInterceptor } from './dataloader.interceptor';

export function CrudResolver(options: CrudModuleOptions): any {
  options.plural = options.plural
    ? options.plural[0].toUpperCase() + options.plural.slice(1)
    : options.entity.name + 's';

  const properties = getPropertiesFromObjectClass(options.dtos.base);

  @ObjectType(`${options.entity.name}FindManyDTO`)
  class FindManyDTO extends Paginated(options.dtos.base) {}

  @ArgsType()
  class FindOneArgsDTO extends FindOneArgs(options.args?.findOne) {}

  @ArgsType()
  class FindManyArgsDTO extends FindManyArgs(options.dtos.base, options) {}

  @InputType(`CreateOne${options.entity.name}DTO`)
  class CreateOneDTO extends FindOneInput(options.dtos.create) {}

  @InputType(`UpdateOne${options.entity.name}DTO`)
  class UpdateOneDTO extends FindOneInput(options.dtos.update) {}

  @Resolver({ isAbstract: true })
  abstract class BaseResolverHost extends BaseFieldResolver(
    options.dtos.base,
    properties,
  ) {
    constructor(private service) {
      super(service);
    }

    // READ
    @Roles(options.access?.findOne)
    // @UseInterceptors(DataLoaderInterceptor(properties))
    @Query(() => options.dtos.base, { name: options.entity.name.toLowerCase() })
    async getOne(
      @Args() queryArgs: FindOneArgsDTO,
      @AuthUser() authUser: AuthUserClass,
    ) {
      return await this.service.findOne({
        dto: options.dtos.base,
        where: queryArgs,
        authUser,
        forcedPublicFilter: options.forcedPublicFilter,
      });
    }

    @Roles(options.access?.findMany)
    // @UseInterceptors(DataLoaderInterceptor(properties))
    @Query(() => FindManyDTO, {
      name: `${options.plural.toLowerCase()}`,
    })
    async getMany(
      @Args() queryArgs: FindManyArgsDTO,
      @AuthUser() authUser: AuthUserClass,
      @Info() info,
    ): Promise<PaginatedType<typeof options.entity>> {
      const withTotalCount = fieldsList(info).includes('totalCount');
      const { nodes, count } = await this.service.findMany({
        properties,
        dto: options.dtos.base,
        defaultResults: options.defaultResults,
        maxPublicResults: options.maxPublicResults,
        defaultSorting: options.defaultSorting,
        forcedPublicFilter: options.forcedPublicFilter,
        paging: queryArgs.paging,
        filter: queryArgs.filter,
        sorting: queryArgs.sorting,
        showDeleted: queryArgs.showDeleted,
        authUser: authUser,
        withTotalCount: withTotalCount,
      });
      return {
        totalCount: count,
        nodes: nodes,
      };
    }

    // CREATE
    @ApplyInterceptors(options.interceptors?.createOne)
    @Roles(options.access?.createOne)
    @Mutation(() => options.dtos.base, { name: `create${options.entity.name}` })
    async createOne(
      @Args('input') input: CreateOneDTO,
      @AuthUser() authUser: AuthUserClass,
    ) {
      return await this.service.createOne(input, properties);
    }

    // UPDATE
    @ApplyInterceptors(options.interceptors?.updateOne)
    @Roles(options.access?.updateOne)
    @UseInterceptors(DataLoaderInterceptor(properties))
    @Mutation(() => options.dtos.base, { name: `update${options.entity.name}` })
    async updateOne(
      @Args('input', { type: () => UpdateOneDTO }) input: UpdateOneDTO,
      @AuthUser() authUser: AuthUserClass,
    ) {
      return await this.service.updateOne(input.id, input.data, properties);
    }

    @ApplyInterceptors(options.interceptors?.updateMany)
    @Roles(options.access?.updateMany)
    @Mutation(() => [options.dtos.base], {
      name: `update${options.plural}`,
    })
    async updateMany(
      @Args('input', { type: () => [UpdateOneDTO] }) input: UpdateOneDTO[],
      @AuthUser() authUser: AuthUserClass,
    ) {
      const updatedEntities = [];
      await Promise.all(
        input.map(async (e) => {
          const updatedEntity = await this.service.updateOne(
            e.id,
            e.data,
            authUser,
          );
          updatedEntities.push(updatedEntity);
        }),
      );
      return updatedEntities;
    }

    // DELETE
    @Roles(options.access?.deleteOne)
    @Mutation(() => options.dtos.base, { name: `delete${options.entity.name}` })
    async deleteOne(@Args('id', { type: () => ID }) id: string) {
      return await this.service.softDeleteOne(id);
    }

    @Roles(options.access?.deleteMany)
    @Mutation(() => [options.dtos.base], {
      name: `delete${options.plural}`,
    })
    async deleteMany(@Args('ids', { type: () => [ID] }) ids: string[]) {
      await this.service.softDeleteMany(ids);
      return ids.map((e) => ({
        id: e,
      }));
    }

    // RESTORE
    @Roles(options.access?.restoreOne)
    @Mutation(() => options.dtos.base, {
      name: `restore${options.entity.name}`,
    })
    async restoreOne(@Args('id', { type: () => ID }) id: string) {
      return await this.service.restoreOne(id);
    }

    @Roles(options.access?.restoreMany)
    @Mutation(() => [options.dtos.base], {
      name: `restore${options.plural}`,
    })
    async restoreMany(@Args('ids', { type: () => [ID] }) ids: string[]) {
      await this.service.restoreMany(ids);
      return ids.map((e) => ({
        id: e,
        deletedAt: null,
      }));
    }

    // FINAL DELETE
    @Roles(options.access?.finalDeleteOne)
    @Mutation(() => options.dtos.base, {
      name: `finalDelete${options.entity.name}`,
    })
    async finalDeleteOne(@Args('id', { type: () => ID }) id: string) {
      return await this.service.finalDeleteOne(id);
    }

    @Roles(options.access?.finalDeleteMany)
    @Mutation(() => [options.dtos.base], {
      name: `finalDelete${options.plural}`,
    })
    async finalDeleteMany(@Args('ids', { type: () => [ID] }) ids: string[]) {
      await this.service.finalDeleteMany(ids);
      return ids.map((e) => ({
        id: e,
      }));
    }
  }
  return BaseResolverHost;
}
