#!/usr/bin/env node
// pm-style: remind the PM when it starts hands-on work itself.
// Registered by the skill's frontmatter for the rest of the session that loaded it.
// It only adds context. It never blocks, and any error ends silently with exit 0.
'use strict';

const HANDS_ON = /(^|[\s;&|(])(python(\d(\.\d+)?)?|py|pytest|dotnet\s+(test|run|build|publish)|ffmpeg|ffprobe|npm|npx|pnpm|yarn|flutter|gradlew?|cargo|go\s+(test|run|build)|node\s+\S+\.(js|mjs|cjs))(\.exe)?(\s|$)/i;
// The skill's own cost scripts are the PM's job at the end of a round.
const OWN_SCRIPTS = /pm-style[\\/]+scripts/i;

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { raw += c; });
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw || '{}');
    // Inside a subagent (clerk, scout, reader) hands-on work is the point.
    if (input.agent_id) return;
    const cmd = (input.tool_input && input.tool_input.command) || '';
    if (!cmd || OWN_SCRIPTS.test(cmd) || !HANDS_ON.test(cmd)) return;
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        additionalContext:
          'pm-style reminder: this looks like hands-on work (a script, a build or a test run). ' +
          'The PM decides and does not do. If this is the one command that checks the number a decision rests on, carry on. ' +
          'If it is a test run, a probe or an exploration, stop after this call and hand it to a tester, a scout or a builder.',
      },
    }));
  } catch (_) {
    // never get in the way
  }
});
