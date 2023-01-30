import { Type } from '@nestjs/common';
import { Field, InputType, registerEnumType } from '@nestjs/graphql';
import { getPropertiesFromObjectClass } from '../../utils/getPropertiesfromClass';

export enum SortingDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

export function SortingTypeBase<T>(modelClass: Type<T>): any {
  registerEnumType(SortingDirection, {
    name: `${modelClass.name}SortingDirection`,
  });

  @InputType({ isAbstract: true })
  abstract class InternalAbstractFilterModelClass {}

  const properties = getPropertiesFromObjectClass(modelClass);
  properties.forEach((propertyMetadata) => {
    if (propertyMetadata.extensions.sortable === true) {
      Field(() => SortingDirection, { nullable: true })(
        InternalAbstractFilterModelClass.prototype,
        propertyMetadata.name,
      );
    }
  });
  return InternalAbstractFilterModelClass;
}
