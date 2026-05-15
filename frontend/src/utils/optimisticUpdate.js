export const optimisticAdd = (
  items,
  newItem
) => {
  return [...items, newItem];
};

export const optimisticUpdate = (
  items,
  updatedItem
) => {
  return items.map((item) =>
    item._id === updatedItem._id
      ? updatedItem
      : item
  );
};