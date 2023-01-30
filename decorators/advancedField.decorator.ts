import { applyDecorators, Type } from '@nestjs/common';
import { Extensions, Field, ReturnTypeFunc } from '@nestjs/graphql';

type Operation = 'is' | 'notIs' | 'in' | 'notIn' | 'iLike';
type Options = {
  returnType: ReturnTypeFunc;
  relation?: [Type<unknown>, string?];
  customResolver?: true;
  filter?: Operation[];
  sortable?: boolean;
  nullable?: boolean;
  paging?: 'offset';
};

export const AdvancedField = (options: Options) => {
  return applyDecorators(
    Extensions(options),
    Field(options.returnType, {
      nullable: options.nullable || true,
    }),
  );
};
