#!/bin/bash
# PRD-0016 Task 6.0 - Testing & QA Commands
# Run these commands to complete final testing

set -e  # Exit on error

echo "================================"
echo "PRD-0016 Testing & QA"
echo "================================"
echo ""

# Task 6.1: Run full test suite
echo "📋 Task 6.1: Running full test suite..."
npm test
echo "✅ All tests passed!"
echo ""

# Task 6.7: Build for production
echo "📦 Task 6.7: Building for production..."
npm run build
echo "✅ Build successful!"
echo ""

# Additional checks
echo "🔍 Running additional checks..."

# Check for TypeScript errors
echo "  - Checking TypeScript..."
npx tsc --noEmit
echo "  ✅ No TypeScript errors"

# Check linting
echo "  - Running linter..."
npm run lint
echo "  ✅ Linting passed"

echo ""
echo "================================"
echo "✅ All automated tests passed!"
echo "================================"
echo ""
echo "Next steps (Manual Testing):"
echo "  [ ] 6.2 - Generate lyrics and verify immediate redirect"
echo "  [ ] 6.3 - Verify no polling requests in Network tab"
echo "  [ ] 6.4 - Test concurrent generation limits"
echo "  [ ] 6.5 - Test on mobile device/emulator"
echo "  [ ] 6.6 - Test error scenarios"
echo ""
echo "To run manual tests, see: tasks/PRD-0016-MANUAL-TEST-PLAN.md"
