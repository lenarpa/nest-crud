import { Type, UnauthorizedException } from '@nestjs/common';
import { AuthUserClass } from 'src/commons/auth/authUser.decorator';
import { UserRole } from 'src/models/users/user.entity';
import { ILike, In, Not, Repository } from 'typeorm';

interface WhereBuilderArgs<T> {
  repository: Repository<T>;
  dto?: any;
  select?: string[];
  alias: string;
  filter?: any;
  sorting?: { [k: string]: 'ASC' | 'DESC' };
  paging?: { offset: number; limit: number };
  forcedPublicFilter?: any;
  defaultSorting?: { [k: string]: 'ASC' | 'DESC' };
  defaultResults?: number;
  maxPublicResults?: number;
  showDeleted?: boolean;
  exclude?: string[];
  relations?: [Type<unknown>, string][];
  authUser: AuthUserClass;
  withTotalCount?: boolean;
  cache?: number;
  properties: any;
}

export async function typeormQueryMany<T>(args: WhereBuilderArgs<T>) {
  const {
    repository,
    defaultResults,
    maxPublicResults,
    defaultSorting,
    forcedPublicFilter,
    select,
    authUser,
    alias,
    filter,
    exclude,
    showDeleted,
    sorting,
    paging,
    withTotalCount,
    cache,
    properties,
  } = args;
  const qb = repository.createQueryBuilder(`${alias}`);

  // PAGINATION
  if (![UserRole.ADMIN, UserRole.EDITOR].includes(authUser.role)) {
    if (maxPublicResults) {
      if (paging?.limit && paging?.limit <= maxPublicResults) {
        qb.take(paging.limit);
      } else if (paging?.limit && paging?.limit > maxPublicResults) {
        qb.take(maxPublicResults);
      } else if (defaultResults > maxPublicResults) {
        qb.take(maxPublicResults);
      } else if (defaultResults) {
        qb.take(defaultResults);
      }
    }

    if (!maxPublicResults) {
      if (paging?.limit) {
        qb.take(paging?.limit);
      } else if (defaultResults) {
        qb.take(defaultResults);
      } else {
        qb.take(10);
      }
    }
  } else {
    if (paging?.limit && paging?.limit !== -1) {
      qb.take(paging.limit);
    } else if (defaultResults && paging?.limit !== -1) {
      qb.take(defaultResults);
    } else if (!paging?.limit) {
      qb.take(10);
    }
  }

  if (paging?.offset) {
    qb.skip(paging?.offset);
  }

  // SORTING
  if (sorting) {
    qb.orderBy(
      `${alias}.${Object.keys(sorting)[0]}`,
      Object.values(sorting)[0],
    );
  } else if (defaultSorting) {
    qb.orderBy(
      `${alias}.${Object.keys(defaultSorting)[0]}`,
      Object.values(defaultSorting)?.[0],
    );
  }

  // SELECT
  if (select && select.length > 0) {
    qb.select([`${alias}.${select[0]}`]);
    select.shift();
    select.forEach((s) => qb.addSelect([`${alias}.${s}`]));
  }

  // WHERE
  if (showDeleted) {
    if (
      ![UserRole.ADMIN, UserRole.EDITOR, UserRole.AUTHOR].includes(
        authUser.role,
      )
    ) {
      throw new UnauthorizedException();
    }
    qb.where(`${alias}.deletedAt IS NOT NULL`);
    qb.withDeleted();
  }

  let relations = [];
  if (properties) {
    relations = properties.filter((e) => e.extensions.relation);
  }

  if (filter) {
    for (const [property, condition] of Object.entries(filter)) {
      if (!exclude || !exclude.includes(property)) {
        for (const [operator, value] of Object.entries(condition)) {
          if (relations?.filter((e) => e.name === property)[0]) {
            const relation = relations?.filter((e) => e.name === property)[0]
              .extensions.relation;
            const relationEntity = relation[0];
            const relationReverseColumn = relation[1];

            qb.leftJoinAndSelect(`${alias}.${property}`, `${property}`);

            if (operator === 'is') {
              if (value === null) {
                qb.andWhere(`${property}.id IS NULL`);
              } else {
                qb.andWhere(`${property}.id = :value`, {
                  value: value,
                });
              }
            }
            if (operator === 'notIs') {
              qb.andWhere((sqb) => {
                const subQuery = sqb
                  .subQuery()
                  .select('1')
                  .from(relationEntity, `${property}`)
                  .leftJoinAndSelect(
                    `${property}.${relationReverseColumn}`,
                    'p',
                  )
                  .where(`p.id = ${alias}.id`)
                  .andWhere(`${property}.id = :value`, {
                    value: value,
                  })
                  .getQuery();
                return 'NOT EXISTS' + subQuery;
              });
            }
            if (operator === 'in') {
              qb.andWhere(`${property}.id IN(:...value)`, {
                value: value,
              });
            }
            if (operator === 'notIn') {
              qb.andWhere((sqb) => {
                const subQuery = sqb
                  .subQuery()
                  .select('1')
                  .from(relationEntity, `${property}`)
                  .leftJoinAndSelect(
                    `${property}.${relationReverseColumn}`,
                    'p',
                  )
                  .where(`p.id = ${alias}.id`)
                  .andWhere(`${property}.id IN(:...value)`, {
                    value: value,
                  })
                  .getQuery();
                return 'NOT EXISTS' + subQuery;
              });
            }
          } else {
            if (operator === 'is') {
              if (value === null) {
                qb.andWhere(`${property} IS NULL`);
              } else {
                qb.andWhere({
                  [property]: value,
                });
              }
            }
            if (operator === 'notIs') {
              if (value === null) {
                qb.andWhere(`${property} IS NOT NULL`);
              } else {
                qb.andWhere({
                  [property]: Not(value),
                });
              }
            }
            if (operator === 'in') {
              qb.andWhere({
                [property]: In(value),
              });
            }
            if (operator === 'notIn') {
              qb.andWhere({
                [property]: Not(In(value)),
              });
            }
            if (operator === 'iLike') {
              qb.andWhere({
                [property]: ILike(value),
              });
            }
          }
        }
      }
    }
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

  if (withTotalCount) {
    const [nodes, count] = await qb.getManyAndCount();
    return {
      nodes: nodes,
      count: count,
    };
  } else {
    const nodes = await qb.getMany();
    return {
      nodes: nodes,
      count: -1,
    };
  }
}
