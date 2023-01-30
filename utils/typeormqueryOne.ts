import { Type, UnauthorizedException } from '@nestjs/common';
import { AuthUserClass } from 'src/commons/auth/authUser.decorator';
import { UserRole } from 'src/models/users/user.entity';
import { Repository } from 'typeorm';

interface WhereBuilderArgs<T> {
  repository: Repository<T>;
  dto?: any;
  select?: string[];
  alias: string;
  where?: any;
  forcedPublicFilter?: any;
  showDeleted?: boolean;
  relations?: [Type<unknown>, string][];
  authUser: AuthUserClass;
  cache?: number;
}

export async function typeormQueryOne<T>(args: WhereBuilderArgs<T>) {
  const {
    repository,
    forcedPublicFilter,
    dto,
    select,
    authUser,
    alias,
    where,
    showDeleted,
    cache,
  } = args;
  const qb = repository.createQueryBuilder(`${alias}`);

  // SELECT
  if (select && select.length > 0) {
    qb.select([`${alias}.${select[0]}`]);
    select.shift();
    select.forEach((s) => qb.addSelect([`${alias}.${s}`]));
  }

  // WHERE
  qb.andWhere(where);

  if (showDeleted) {
    if (
      ![UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR].includes(
        authUser.role,
      )
    ) {
      throw new UnauthorizedException();
    }
    qb.andWhere(`${alias}.deletedAt IS NOT NULL`);
    qb.withDeleted();
  }

  if (forcedPublicFilter) {
    if (
      ![UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR].includes(
        authUser.role,
      )
    ) {
      qb.andWhere(forcedPublicFilter);
    }
  }

  if (cache) {
    qb.cache(cache);
  }

  return await qb.getOneOrFail();
}
