import { PropertyMetadata } from '@nestjs/graphql/dist/schema-builder/metadata';
import { Type } from '@nestjs/common';
import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';

export interface ITypeFindManyArgs {
  paging: {
    offset: number;
    limit: number;
  };
  sorting?: any;
  filter?: any;
}

export function RelationFindManyArgs(
  baseDto,
  properties: PropertyMetadata,
): any {
  const propertyName = properties.name;
  @InputType(`${baseDto.name}${propertyName}PagingArgs`)
  class PagingType {
    @Field(() => Int, { nullable: true })
    limit: number;

    @Field(() => Int, { nullable: true })
    offset: number;
  }

  if (properties.extensions.paging === 'offset') {
    @ArgsType()
    class Args {
      @Field(() => PagingType, { nullable: true })
      paging: PagingType;
    }
    return Args as Type<ITypeFindManyArgs>;
  }

  // const classRefProperties = getPropertiesFromObjectClass(relationDto);
  // const hasFilterExtensions =
  //   classRefProperties
  //     .map((e) => e.extensions?.filter)
  //     .filter((e) => e !== undefined).length > 0;
  // const hasSortingExtensions =
  //   classRefProperties
  //     .map((e) => {
  //       return e.extensions?.sortable;
  //     })
  //     .filter((e) => e !== undefined).length > 0;

  // if (hasFilterExtensions && hasSortingExtensions) {
  //   @InputType(`${classRef.name}FilterArgs`)
  //   class FilterType extends FilterTypeBase(classRef) {}

  //   @InputType(`${classRef.name}SortingArgs`)
  //   class SortingType extends SortingTypeBase(classRef) {}

  //   @ArgsType()
  //   class Args {
  //     @Field(() => PagingType, { nullable: true })
  //     paging: PagingType;

  //     @Field(() => SortingType, { nullable: true })
  //     sorting: SortingType;

  //     @Field(() => FilterType, { nullable: true })
  //     filter: FilterType;

  //     @Field({ nullable: true })
  //     showDeleted: boolean;
  //   }
  //   return Args as Type<ITypeFindManyArgs>;
  // } else if (hasFilterExtensions && !hasSortingExtensions) {
  //   @InputType(`${classRef.name}FilterArgs`)
  //   class FilterType extends FilterTypeBase(classRef) {}

  //   @ArgsType()
  //   class Args {
  //     @Field(() => PagingType, { nullable: true })
  //     paging: PagingType;

  //     @Field(() => FilterType, { nullable: true })
  //     filter: FilterType;

  //     @Field({ nullable: true })
  //     showDeleted: boolean;
  //   }
  //   return Args as Type<ITypeFindManyArgs>;
  // } else

  // if (!hasFilterExtensions && hasSortingExtensions) {
  //   @InputType(`${classRef.name}SortingArgs`)
  //   class SortingType extends SortingTypeBase(classRef) {}

  //   @ArgsType()
  //   class Args {
  //     @Field(() => PagingType, { nullable: true })
  //     paging: PagingType;

  //     @Field(() => SortingType, { nullable: true })
  //     sorting: SortingType;

  //     @Field({ nullable: true })
  //     showDeleted: boolean;
  //   }
  //   return Args as Type<ITypeFindManyArgs>;
  // } else {
  @ArgsType()
  class Args {}
  return Args as Type<ITypeFindManyArgs>;
}
