type StringObject = { [_: string]: any };

const getObjectSorted = (o: StringObject): StringObject =>
  Object.keys(o)
    .sort()
    .reduce<StringObject>((acc, key) => {
      acc[key] = o[key];
      return acc;
    }, {});

export { getObjectSorted };
