# Debug Log - VJ Tam Tam Project

## CRITICAL ISSUE - REQUIRES PM ATTENTION

### uiManager.test.js - Memory Leak Issue (UNRESOLVED)
**Date**: 2024-01-XX  
**Status**: BLOCKED - Tests temporarily removed due to severe memory leak  
**Priority**: HIGH - Blocks complete test coverage  

#### Issue Summary
Attempted to create comprehensive test suite for `app/src/uiManager.js` (0% test coverage → target coverage). **FAILED due to unresolvable memory leak causing test runner to crash with heap exhaustion.**

#### Technical Details
- **Symptom**: Tests hang indefinitely, consume 2GB+ RAM, crash with "JavaScript heap out of memory"
- **Root Cause**: Infinite loop in `ArrayIteratorPrototypeNext` during module loading phase
- **Stack Trace Pattern**: Module import triggers infinite array iteration, likely in dependency chain
- **Attempted Solutions**: 
  - Comprehensive mocking of all dependencies
  - Safe DOM element mocking 
  - Delayed module imports
  - Event listener cleanup strategies
  - Multiple test rewrite approaches (4+ iterations)

#### Suspect Areas
1. **`processDirectory()` method**: Recursive directory processing with `readEntries()` calls
2. **Dependency chain**: Complex imports (`eventBus`, `mediaProcessor`, `stateManager`, etc.)
3. **DOM mocking conflicts**: Potential issues with `window.addEventListener` or `document` mocking
4. **Async callback chains**: Possible Promise resolution loops

#### Impact Assessment
- **POSITIVE**: Successfully created tests for `toastManager.js` (19 tests) and `fileSystemAccessFacade.js` (35 tests) 
- **NEGATIVE**: `uiManager.js` remains at 0% test coverage (significant module - handles drag/drop, UI state, file picker)
- **BLOCKER**: Cannot achieve full test coverage goals without resolving this issue

#### Recommended Next Steps
1. **Senior Engineering Review**: Memory leak requires deeper investigation by engineer with more V8/Node.js debugging experience
2. **Module Refactoring**: Consider breaking down `uiManager.js` into smaller, more testable modules
3. **Alternative Testing Strategy**: Integration tests instead of unit tests, or selective method testing
4. **Debugging Tools**: Use Node.js heap profiler, memory snapshots to identify leak source

#### Files Affected
- ❌ `app/src/uiManager.test.js` - DELETED due to memory leak
- ✅ `app/src/toastManager.test.js` - WORKING (19 tests)  
- ✅ `app/src/facades/fileSystemAccessFacade.test.js` - WORKING (35 tests)

**REQUIRES PM DECISION**: Priority vs. timeline trade-off for achieving 100% test coverage.

---

## Other Debug Items
(Additional debug items would be listed here) 