import { applyDecorators, UseInterceptors } from '@nestjs/common';

export const CrudInterceptors = 'crudInterceptors';
export const ApplyInterceptors = (interceptors: any) => {
  if (interceptors) {
    return applyDecorators(UseInterceptors(interceptors));
  }
  return (e) => e;
};
