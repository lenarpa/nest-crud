import { Type } from '@nestjs/common';
import { Field, ID, InputType } from '@nestjs/graphql';
import {
  getPropertiesFromObjectClass,
  getPropertiesFromInputClass,
} from '../../utils/getPropertiesfromClass';

function GenerateFilterOperations(operations, className, typeFn) {
  @InputType(`${className}Filter`)
  abstract class InternalFilterOperationClass {}

  @InputType(`${className}FilterClass`)
  class FilterOperationsClass {
    @Field(() => typeFn)
    is: any;

    @Field(() => typeFn)
    notIs: any;

    @Field(() => [typeFn])
    in: any;

    @Field(() => [typeFn])
    notIn: any;

    @Field(() => typeFn)
    iLike: any;
  }

  const properties = getPropertiesFromInputClass(FilterOperationsClass);
  properties.forEach((propertyMetadata) => {
    if (operations.includes(propertyMetadata.name)) {
      if (['in', 'notIn'].includes(propertyMetadata.name)) {
        Field(() => [propertyMetadata.typeFn()], { nullable: 'itemsAndList' })(
          InternalFilterOperationClass.prototype,
          propertyMetadata.name,
        );
      } else {
        Field(() => propertyMetadata.typeFn(), { nullable: true })(
          InternalFilterOperationClass.prototype,
          propertyMetadata.name,
        );
      }
    }
  });

  return InternalFilterOperationClass;
}

export function FilterTypeBase<M>(modelClass: Type<M>): any {
  @InputType({ isAbstract: true })
  abstract class InternalAbstractFilterModelClass {}

  const properties = getPropertiesFromObjectClass(modelClass);
  properties.forEach((propertyMetadata) => {
    if (propertyMetadata.extensions.filter) {
      const filterOperations = propertyMetadata.extensions.filter;
      const returnType = propertyMetadata.extensions.relation
        ? ID
        : propertyMetadata.typeFn();

      @InputType(`${modelClass.name}${propertyMetadata.name}Operation`)
      class OperationReturnType extends GenerateFilterOperations(
        filterOperations,
        `${modelClass.name}${propertyMetadata.name}`,
        returnType,
      ) {}

      Field(() => OperationReturnType, { nullable: true })(
        InternalAbstractFilterModelClass.prototype,
        propertyMetadata.name,
      );
    }
  });
  return InternalAbstractFilterModelClass;
}
