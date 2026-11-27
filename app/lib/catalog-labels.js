const COLOR_ALIASES = new Map(Object.entries({
  '蓝色': 'Blue', '绿色': 'Green', '橙色': 'Orange', '黄色': 'Yellow', '粉色': 'Pink', '透明': 'Transparent',
}));

export function catalogColorLabel(value) {
  const label = typeof value === 'string' ? value.trim() : '';
  return COLOR_ALIASES.get(label) || label;
}

export function catalogDisplayTitle(title = '') {
  return title.replace(/(\s[-–—]\s)([^-–—]+)$/, (suffix, separator, color) => {
    const translation = COLOR_ALIASES.get(color.trim());
    return translation ? separator + translation : suffix;
  });
}
