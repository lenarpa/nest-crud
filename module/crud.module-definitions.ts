import { ConfigurableModuleBuilder } from '@nestjs/common';
import { CrudModuleOptions } from './crud-module-interfaces';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
  new ConfigurableModuleBuilder<CrudModuleOptions>().build();
