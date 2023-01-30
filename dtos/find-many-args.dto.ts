import { Type } from '@nestjs/common';
import { ArgsType, Field, InputType, Int } from '@nestjs/graphql';
import { FilterTypeBase } from './base/FilterTypeBase';
import { SortingTypeBase } from './base/SortingTypeBase';
import { getPropertiesFromObjectClass } from '../utils/getPropertiesfromClass';
import { CrudModuleOptions } from '../module/crud-module-interfaces';

export enum SortingDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export interface ITypeFindManyArgs {
  paging: {
    offset: number;
    limit: number;
  };
  sorting?: any;
  filter?: any;
}

export function FindManyArgs(classRef, options: CrudModuleOptions): any {
  @InputType(`${options.plural}PagingArgs`)
  class PagingType {
    @Field(() => Int, { nullable: true })
    limit: number;

    @Field(() => Int, { nullable: true })
    offset: number;
  }

  const classRefProperties = getPropertiesFromObjectClass(classRef);
  const hasFilterExtensions =
    classRefProperties
      .map((e) => e.extensions?.filter)
      .filter((e) => e !== undefined).length > 0;
  const hasSortingExtensions =
    classRefProperties
      .map((e) => {
        return e.extensions?.sortable;
      })
      .filter((e) => e !== undefined).length > 0;

  if (hasFilterExtensions && hasSortingExtensions) {
    @InputType(`${options.plural}FilterArgs`)
    class FilterType extends FilterTypeBase(classRef) {}

    @InputType(`${options.plural}SortingArgs`)
    class SortingType extends SortingTypeBase(classRef) {}

    @ArgsType()
    class Args {
      @Field(() => PagingType, { nullable: true })
      paging: PagingType;

      @Field(() => SortingType, { nullable: true })
      sorting: SortingType;

      @Field(() => FilterType, { nullable: true })
      filter: FilterType;

      @Field({ nullable: true })
      showDeleted: boolean;
    }
    return Args as Type<ITypeFindManyArgs>;
  } else if (hasFilterExtensions && !hasSortingExtensions) {
    @InputType(`${classRef.name}FilterArgs`)
    class FilterType extends FilterTypeBase(classRef) {}

    @ArgsType()
    class Args {
      @Field(() => PagingType, { nullable: true })
      paging: PagingType;

      @Field(() => FilterType, { nullable: true })
      filter: FilterType;

      @Field({ nullable: true })
      showDeleted: boolean;
    }
    return Args as Type<ITypeFindManyArgs>;
  } else if (!hasFilterExtensions && hasSortingExtensions) {
    @InputType(`${classRef.name}SortingArgs`)
    class SortingType extends SortingTypeBase(classRef) {}

    @ArgsType()
    class Args {
      @Field(() => PagingType, { nullable: true })
      paging: PagingType;

      @Field(() => SortingType, { nullable: true })
      sorting: SortingType;

      @Field({ nullable: true })
      showDeleted: boolean;
    }
    return Args as Type<ITypeFindManyArgs>;
  } else {
    @ArgsType()
    class Args {
      @Field(() => PagingType, { nullable: true })
      paging: PagingType;

      @Field({ nullable: true })
      showDeleted: boolean;
    }
    return Args as Type<ITypeFindManyArgs>;
  }
}
