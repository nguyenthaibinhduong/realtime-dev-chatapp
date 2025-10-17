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

const convertObjectToKeyValue = (obj: Record<string, any> | null | undefined) => {
  if (!obj || typeof obj !== "object") return [];
  try {
    return Object.entries(obj).map(([key, value]) => ({
      id: typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${key}-${Date.now()}`,
      keyItem: key,
      valueItem: value,
      enabled: true,
    }));
  } catch (err) {
    return [];
  }
};

export { convertKeyValueToObject, convertObjectToKeyValue };
