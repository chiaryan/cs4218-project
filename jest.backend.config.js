export default {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: ["<rootDir>/controllers/*.test.js", "<rootDir>/routes/*.test.js", "<rootDir>/helpers/*.test.js", "<rootDir>/middlewares/*.test.js", "<rootDir>/models/*.test.js", "<rootDir>/config/*.test.js", "<rootDir>/test-integration/*.test.js"],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: ["controllers/**", "routes/**", "helpers/**", "config/**", "middlewares/**", "models/**"],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
