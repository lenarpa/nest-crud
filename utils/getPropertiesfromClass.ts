import { Type } from '@nestjs/common';
import { PartialType, TypeMetadataStorage } from '@nestjs/graphql';
import { PropertyMetadata } from '@nestjs/graphql/dist/schema-builder/metadata';

interface Options {
  find: {
    forcedPublicFilter?: any;
    defaultSorting?: { [k: string]: 'ASC' | 'DESC' };
    defaultResults?: number;
    maxPublicResults?: number;
  };
}
export function getPropertiesFromObjectClass(modelClass) {
  // workaround to force nestjs providing related metadata in TypeMetadataStorage
  PartialType(modelClass);
  let { properties } =
    TypeMetadataStorage.getObjectTypeMetadataByTarget(modelClass) || {};
  properties = inheritClassFields(modelClass, properties);
  return properties;
}

export function getOptionsFromObjectClass(modelClass): Options {
  // workaround to force nestjs providing related metadata in TypeMetadataStorage
  PartialType(modelClass);
  const { extensions }: any =
    TypeMetadataStorage.getObjectTypeMetadataByTarget(modelClass) || {};
  const options: Options = extensions.options;

  if (options) return options;
  return {
    find: {
      defaultSorting: { createdAt: 'DESC' },
      defaultResults: 12,
      maxPublicResults: 50,
    },
  };
}

// export function getPropertiesFromArgsClass(modelClass) {
//   // workaround to force nestjs providing related metadata in TypeMetadataStorage
//   PartialType(modelClass);
//   let { properties } =
//     TypeMetadataStorage.getArgumentsMetadataByTarget(modelClass) || {};
//   properties = inheritClassFields(modelClass, properties);
//   return properties;
// }

export function getPropertiesFromInputClass(modelClass) {
  // workaround to force nestjs providing related metadata in TypeMetadataStorage
  PartialType(modelClass);

  let { properties } =
    TypeMetadataStorage.getInputTypeMetadataByTarget(modelClass) || {};
  properties = inheritClassFields(modelClass, properties);
  return properties;
}

function inheritClassFields(
  target: Type<unknown>,
  properties: PropertyMetadata[],
): PropertyMetadata[] {
  try {
    const parent = Object.getPrototypeOf(target);
    if (parent === Function) {
      return properties;
    }
    const objectMetadata = TypeMetadataStorage.getObjectTypeMetadataByTarget(
      parent as Type<unknown>,
    );
    const parentProperties = objectMetadata?.properties || [];
    return inheritClassFields(parent, [...parentProperties, ...properties]);
  } catch (err) {
    return properties;
  }
}
