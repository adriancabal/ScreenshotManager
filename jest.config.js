module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-fs|@react-native-async-storage|@react-native-community)/)',
  ],
};
