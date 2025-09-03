#!/usr/bin/env node

// Test script to verify Supabase singleton pattern
// This tests that the client maintains a single instance across imports

const path = require('path');

// Set up module aliases
require('module-alias').addAlias('@', path.resolve(__dirname, '../src'));

// Import the singleton functions multiple times
const { getSingletonSupabaseClient: getClient1 } = require('../src/lib/supabase');
const { getSingletonSupabaseClient: getClient2 } = require('../src/lib/supabase');

// Create instances
const instance1 = getClient1();
const instance2 = getClient2();

// Test 1: Check if instances are the same
console.log('Test 1: Singleton Pattern');
console.log('instance1 === instance2:', instance1 === instance2);

if (instance1 === instance2) {
  console.log('✅ SUCCESS: Singleton pattern is working correctly');
} else {
  console.log('❌ FAILURE: Multiple instances detected');
  process.exit(1);
}

// Test 2: Check repeated calls
console.log('\nTest 2: Repeated Calls');
const instances = [];
for (let i = 0; i < 10; i++) {
  const { getSingletonSupabaseClient } = require('../src/lib/supabase');
  instances.push(getSingletonSupabaseClient());
}

const allSame = instances.every(inst => inst === instance1);
console.log('All 10 instances are the same:', allSame);

if (allSame) {
  console.log('✅ SUCCESS: All instances point to the same object');
} else {
  console.log('❌ FAILURE: Different instances detected');
  process.exit(1);
}

console.log('\n🎉 All tests passed! The singleton pattern is working correctly.');