export const labelForGroup = (groups, key) => {
  const found = (groups || []).find((g) => g.key === key);
  return found ? found.label : key;
};
 
export const orderGroups = (groups) => {
  return [...(groups || [])].sort((a, b) => (a.order ?? 9999) - (b.order ?? 9999));
}; 