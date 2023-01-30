import { Field, ID, InputType } from '@nestjs/graphql';

export function FindOneInput(classRef): any {
  if (!classRef) {
    @InputType()
    class Input {
      @Field(() => ID)
      id: string;
    }
    return Input as any;
  } else {
    @InputType()
    class Input extends classRef {}

    return Input as any;
  }
}
