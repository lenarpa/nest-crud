import { Type } from '@nestjs/common';
import { AccessRoles } from 'src/commons/access/roles.decorator';

export interface CrudModuleOptions {
  imports?: any;
  resolver?: any;
  entity?: Type<any>;
  plural?: string;
  dtos?: {
    base?: Type<any>;
    create?: Type<any>;
    update?: Type<any>;
  };
  args?: {
    findOne?: Type<any>;
  };
  defaultResults?: number;
  maxPublicResults?: number;
  defaultSorting?: any;
  forcedPublicFilter?: any;
  interceptors?: {
    createOne?: any;
    updateOne?: any;
    updateMany?: any;
  };
  access?: {
    findOne?: AccessRoles;
    findMany?: AccessRoles;
    createOne?: AccessRoles;
    createMany?: AccessRoles;
    updateOne?: AccessRoles;
    updateMany?: AccessRoles;
    deleteOne?: AccessRoles;
    deleteMany?: AccessRoles;
    restoreOne?: AccessRoles;
    restoreMany?: AccessRoles;
    finalDeleteOne?: AccessRoles;
    finalDeleteMany?: AccessRoles;
  };
}
