/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  setupFiles: ['dotenv/config'],
  testEnvironment: 'node',
  modulePathIgnorePatterns: ['.yalc', 'node_modules'],
  testMatch: ['**/?(*.)+(spec|test).ts?(x)'],
};
