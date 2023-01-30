import { ArgsType, Field, ID } from '@nestjs/graphql';

export function FindOneArgs(classRef): any {
  if (!classRef) {
    @ArgsType()
    class Args {
      @Field(() => ID)
      id: string;
    }
    return Args as any;
  } else {
    @ArgsType()
    class Args extends classRef {}

    return Args as any;
  }
}
