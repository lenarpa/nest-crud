import {
  DynamicModule,
  Injectable,
  Module,
  UseInterceptors,
} from '@nestjs/common';
import { Resolver } from '@nestjs/graphql';
import { DataSource } from 'typeorm';
import { getPropertiesFromObjectClass } from '../utils/getPropertiesfromClass';
import { CrudModuleOptions } from './crud-module-interfaces';
import { CrudResolver } from './crud.resolver';
import { CrudService } from './crud.service';
import { DataLoaderInterceptor } from './dataloader.interceptor';

@Module({})
export class CrudModule {
  static register(options: CrudModuleOptions): DynamicModule {
    const properties = getPropertiesFromObjectClass(options.dtos.base);

    @Injectable()
    class GeneratedService extends CrudService(options) {
      constructor(dataSource: DataSource) {
        super(dataSource);
      }
    }
    @UseInterceptors(DataLoaderInterceptor(properties))
    @Resolver(() => options.dtos.base)
    class GeneratedResolver extends CrudResolver(options) {
      constructor(private service: GeneratedService) {
        super(service);
      }
    }

    return {
      module: CrudModule,
      imports: options.imports ? options.imports : undefined,
      providers: [
        {
          provide: 'CONFIG_OPTIONS',
          useValue: options,
        },
        GeneratedService,
        GeneratedResolver,
      ],
    };
  }
}
