const convertKeyValueToObject = (keyPairs) => {
  return [...keyPairs].reduce((data, pair) => {
    const key = pair.keyItem;
    const value = pair.valueItem;

    if (key === "") return data;
    return {
      ...data,
      [key]: value,
    };
  }, {});
};

const convertObjectToKeyValue = (obj: Record<string, string>) => {
  return Object.entries(obj).map(([key, value]) => ({
    id: crypto.randomUUID(),
    keyItem: key,
    valueItem: value,
    enabled: true,
  }));
};

export { convertKeyValueToObject, convertObjectToKeyValue };
