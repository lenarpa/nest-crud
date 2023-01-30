import { applyDecorators } from '@nestjs/common';
import { Extensions } from '@nestjs/graphql';
import { FindManyOptions } from 'typeorm';

interface Options<T> {
  find?: {
    defaultResults?: number;
    maxPublicResults?: number;
    defaultSorting?: { [k: string]: 'ASC' | 'DESC' };
    forcedPublicFilter?: FindManyOptions<T>['where'];
  };
}

export function ObjectOptions<T>(options: Options<T>) {
  const withDefaultOptions = {
    find: {
      defaultResults: options?.find?.defaultResults || 12,
      maxPublicResults: options?.find?.maxPublicResults || 50,
      defaultSorting: options?.find?.defaultSorting || { createdAt: 'DESC' },
      forcedPublicFilter: options?.find?.forcedPublicFilter,
    },
  };

  return applyDecorators(Extensions({ options: withDefaultOptions }));
}
