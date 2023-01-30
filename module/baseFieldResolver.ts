import { HttpException, Type, HttpStatus } from '@nestjs/common';
import {
  Args,
  ArgsType,
  Context,
  Parent,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { PropertyMetadata } from '@nestjs/graphql/dist/schema-builder/metadata';
import { AuthUser, AuthUserClass } from 'src/commons/auth/authUser.decorator';
import { RelationFindManyArgs } from '../dtos/relation-find-many-args.dto';

export function BaseFieldResolver(dto: Type<any>, properties: any): any {
  @Resolver(() => dto, { isAbstract: true })
  class InternalFieldResolverClass {
    constructor(private service) {}
  }

  const Bundle = (properties: PropertyMetadata, Base) => {
    if (
      properties.extensions.relation &&
      !properties.extensions.customResolver
    ) {
      const name = properties.name;
      const entity: any = properties.extensions.relation[0];
      const returnTypeFn: any = properties.extensions.returnType;
      const relationDto = returnTypeFn();

      @ArgsType()
      class RelationFindOneArgsDTO extends RelationFindManyArgs(
        dto,
        properties,
      ) {
        constructor(private service) {
          super(service);
        }
      }

      @Resolver(() => dto, { isAbstract: true })
      class B extends Base {
        @ResolveField(name)
        async [name](
          @Parent() parent,
          @Args() args: RelationFindOneArgsDTO,
          @AuthUser() authUser: AuthUserClass,
          @Context() context: any,
        ) {
          try {
            const loaderName = `${entity.name.toLowerCase()}Loader`;
            if (Array.isArray(relationDto)) {
              if (context.req.loaders) {
                if (parent[`${properties.name}Ids`]) {
                  const { nodes } = await this.service.findMany({
                    filter: { id: { in: parent[`${properties.name}Ids`] } },
                    select: ['id'],
                    entity: entity,
                    dto: relationDto[0],
                    paging: args?.paging,
                    authUser,
                  });
                  const ids = nodes.map((e) => e.id);
                  if (!ids) return null;
                  return ids.map((id) =>
                    context.req.loaders[loaderName].load(id),
                  );
                }
              } else {
                if (parent[`${properties.name}Ids`]) {
                  const { nodes } = await this.service.findMany({
                    filter: { id: { in: parent[`${properties.name}Ids`] } },
                    entity: entity,
                    dto: relationDto[0],
                    paging: args?.paging,
                    authUser,
                  });
                  return nodes;
                }
              }
            } else {
              if (context.req.loaders) {
                const id = parent[`${properties.name}Id`];
                if (!id) return null;
                return context.req.loaders[loaderName].load(id);
              } else {
                const id = parent[`${properties.name}Id`];
                if (!id) return null;
                return await this.service.findOne({
                  where: { id },
                  entity: entity,
                  dto: relationDto[0],
                  authUser,
                });
              }
            }
          } catch (err) {
            console.error(err);
            throw new HttpException(
              { message: err },
              HttpStatus.INTERNAL_SERVER_ERROR,
            );
          }
        }
      }
      return B;
    }
    return Base;
  };

  const FieldResolvers = properties.reduce(
    (A, B) => Bundle(B, A),
    InternalFieldResolverClass,
  );

  return FieldResolvers;
}
