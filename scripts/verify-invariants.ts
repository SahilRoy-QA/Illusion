/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * CLI Verification Script: 13 Architectural Invariants Test Suite
 * Usage: npx tsx scripts/verify-invariants.ts
 */

import { runAllInvariantTests } from '../src/utils/invariantRunner.ts';

async function main() {
  console.log('====================================================');
  console.log('🚀 illusion Platform Architectural Invariants Suite');
  console.log('====================================================\n');

  const report = await runAllInvariantTests();

  for (const res of report.results) {
    const icon = res.status === 'passed' ? '✅' : '❌';
    console.log(`${icon} Invariant ${res.num}: ${res.name} (${res.durationMs}ms)`);
    console.log(`   Assertion: ${res.assertion}`);
    console.log(`   Result:    ${res.details}\n`);
  }

  console.log('----------------------------------------------------');
  console.log(`Total: ${report.total} | Passed: ${report.passed} | Failed: ${report.failed}`);
  console.log(`Status: ${report.allPassed ? 'ALL INVARIANTS PASSING' : 'INVARIANTS FAILED'}`);
  console.log('----------------------------------------------------\n');

  if (!report.allPassed) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal error running invariant suite:', err);
  process.exit(1);
});
