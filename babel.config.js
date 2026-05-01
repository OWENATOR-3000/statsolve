module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // jsxImportSource: "nativewind" enables className prop on all RN components.
      // NativeWind v4.1+ Metro transformer (metro.config.js) handles CSS processing.
      // Reanimated v4+ no longer needs a Babel plugin — worklets run via Metro.
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
  };
};
