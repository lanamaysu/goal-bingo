// Helper to generate winning lines for any N x N grid
export const getWinningLines = (size: number): number[][] => {
  const lines: number[][] = [];

  // Rows
  for (let r = 0; r < size; r++) {
    const row = [];
    for (let c = 0; c < size; c++) {
      row.push(r * size + c);
    }
    lines.push(row);
  }

  // Columns
  for (let c = 0; c < size; c++) {
    const col = [];
    for (let r = 0; r < size; r++) {
      col.push(r * size + c);
    }
    lines.push(col);
  }

  // Diagonals
  const d1 = [];
  const d2 = [];
  for (let i = 0; i < size; i++) {
    d1.push(i * size + i); // Top-left to bottom-right
    d2.push(i * size + (size - 1 - i)); // Top-right to bottom-left
  }
  lines.push(d1);
  lines.push(d2);

  return lines;
};

// Deprecated static export, kept for compatibility if needed, but prefer getWinningLines(3)
export const WINNING_LINES = getWinningLines(3);

export const DEFAULT_CONFIG = {
  groupPenalty: '',
  groupTargetScore: 0, // Calculated dynamically in GameConfigModal
  minLinesForSafe: 1,
  individualSafeScore: 100,
  gridSize: 3,
  goalsPerUser: 3,
  totalPlayers: 0, // Initialize as 0 to detect if config setup is needed
  activeMonths: 11, // Default to 11 months (assuming 1 month break)
};

export const APPS_SCRIPT_TEMPLATE = `
/**
 * GOAL BINGO BACKEND (v2.1 - with Merge Logic & Enhanced Timeout)
 *
 * Update Instructions:
 * If you are updating from an older version, simply replace all code in your Apps Script
 * with this code. No need to delete the spreadsheet.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Wait up to 60s for other processes to finish (increased from 30s).
  // This ensures serial execution of merges and reduces "Server busy" errors.
  // If lock acquisition fails, return a retry-after header.
  if (!lock.tryLock(60000)) {
    return ContentService.createTextOutput(JSON.stringify({
      'error': 'Server busy',
      'retryAfter': 5000 // Client should retry after 5 seconds
    }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var json = JSON.parse(e.postData.contents);
    var action = json.action || 'save';

    // --- ACTION: LIST YEARS ---
    if (action === 'listYears') {
      var sheets = doc.getSheets();
      var years = [];
      for (var i = 0; i < sheets.length; i++) {
        years.push(sheets[i].getName());
      }
      return ContentService.createTextOutput(JSON.stringify({ years: years }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Determine Year
    var year = json.year;
    if (action === 'save' && json.gameState && json.gameState.config) {
      year = json.gameState.config.year;
    }
    if (!year) throw new Error('Year is missing');

    var sheet = doc.getSheetByName(year);

    // --- ACTION: LOAD ---
    if (action === 'load') {
      if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ exists: false }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      var range = sheet.getRange(1, 1);
      var data = range.getValue();
      if (!data) {
        return ContentService.createTextOutput(JSON.stringify({ exists: false }))
          .setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(data)
        .setMimeType(ContentService.MimeType.JSON);
    }

    // --- ACTION: SAVE (Merge Logic) ---
    if (action === 'save') {
      if (!sheet) {
        sheet = doc.insertSheet(year);
      }

      var incomingState = json.gameState;
      var range = sheet.getRange(1, 1);
      var currentDataStr = range.getValue();

      var finalState = incomingState;

      // PERFORM MERGE if data exists
      if (currentDataStr) {
        try {
          var currentState = JSON.parse(currentDataStr);

          // 1. Merge Config (Incoming usually wins for global settings, or keep existing if partial)
          // For simplicity, we assume incoming config is the latest intent for setup,
          // but we preserve ID/Grid mapping if Phase is not Setup to prevent reset.
          if ((currentState.phase === 'grid-review' || currentState.phase === 'active') &&
            (incomingState.phase === 'grid-review' || incomingState.phase === 'active')) {
            // Protect grid mapping from being wiped by a client that might have stale config
            incomingState.gridMapping = currentState.gridMapping;
          }

          // 2. Merge Users
          // Add new users that don't exist in current state
          var userMap = {};
          currentState.users.forEach(function (u) { userMap[u.id] = u; });

          incomingState.users.forEach(function (u) {
            if (!userMap[u.id]) {
              currentState.users.push(u); // Add new user
            } else {
              // Update existing user (e.g. ready status, penalty text)
              // Simple strategy: Always update user details from incoming
              var idx = currentState.users.findIndex(function (cu) { return cu.id === u.id });
              if (idx !== -1) currentState.users[idx] = u;
            }
          });

          // 3. Merge Goals (CRITICAL)
          // Use version number and lastUpdated timestamp to determine winner per goal
          var currentGoalMap = {};
          currentState.goals.forEach(function (g, i) { currentGoalMap[g.id] = i; });

          incomingState.goals.forEach(function (incGoal) {
            var idx = currentGoalMap[incGoal.id];
            if (idx !== undefined) {
              var curGoal = currentState.goals[idx];
              var incVersion = incGoal.version || 0;
              var curVersion = curGoal.version || 0;

              if (incVersion > curVersion) {
                currentState.goals[idx] = incGoal;
              } else if (incVersion === curVersion) {
                var incTime = incGoal.lastUpdated || 0;
                var curTime = curGoal.lastUpdated || 0;
                if (incTime > curTime) {
                  currentState.goals[idx] = incGoal;
                }
                // If timestamps also equal, keep current (conservative approach)
              }
              // If incVersion < curVersion, keep current (don't downgrade)
            } else {
              // New goal found
              currentState.goals.push(incGoal);
            }
          });

          // 4. Update Phase & Config
          currentState.phase = incomingState.phase;
          currentState.config = incomingState.config;

          finalState = currentState;

        } catch (parseError) {
          // If parsing fails (corrupt DB), fallback to overwrite
          finalState = incomingState;
        }
      }

      // Save the merged state
      var finalJson = JSON.stringify(finalState);
      range.setValue(finalJson);

      // Return the MERGED state so the client can update its local view
      return ContentService.createTextOutput(finalJson)
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (e) {
    return ContentService.createTextOutput(JSON.stringify({ 'error': e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput('Bingo App Backend is Running');
}
`.trim();
