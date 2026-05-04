// expo-location is not supported on web in this app.
// This stub prevents bundler crashes on web.
const Accuracy = { Balanced: 3, High: 4, Highest: 5, Low: 1, Lowest: 0, BestForNavigation: 6 };

module.exports = {
  Accuracy,
  requestForegroundPermissionsAsync: async () => ({ status: "denied" }),
  requestBackgroundPermissionsAsync: async () => ({ status: "denied" }),
  getCurrentPositionAsync: async () => ({ coords: { latitude: 0, longitude: 0, accuracy: 0 } }),
  watchPositionAsync: async () => ({ remove: () => {} }),
  hasServicesEnabledAsync: async () => false,
  getLastKnownPositionAsync: async () => null
};
