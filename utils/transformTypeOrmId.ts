export function transformTypeOrmId(input, properties) {
  if (!properties.find) return input;

  Object.keys(input).map((key) => {
    const prop = properties.find((e) => e.name === key);
    if (prop?.extensions?.relation) {
      if (Array.isArray(input[key])) {
        input[key] = input[key].map((e) => ({ id: e }));
      } else {
        input[key] = { id: input[key] };
      }
    }
  });
  return input;
}
