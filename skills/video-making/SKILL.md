---
name: video-making
description: Use when amier asks to make, plan, script, narrate, animate, score, edit or revise a video of any kind - a concept or proposal film, a boss video, an explainer, a demo, a promo, a training clip, a study of someone else's video - or talks about a video's storyboard, voice-over, captions, background music or render. Says where past films, tools and lessons live, and how to start a new video without copying the old one's purpose or style.
---

# Video making

amier makes videos with AI sessions, mostly for the boss and clients.
Each video so far has its own folder and `STATUS.md` (or script file) with the full record.
This skill is a map to those records and the lessons from them. It is not a template.

## Past videos are a toolkit, not a template

The videos so far (as of 2026-11-24) are three narrated proposal films drawn from code in a dark 2D style, and a series of proof-of-concept showcase videos built from real drone footage plus one drawn animation.
They ran from about 1:30 to 3:30.
That is a history, not a default.
The next video may have a different purpose, audience, length, look or medium (live footage, screen recording, 3D, a light style, no narration, a different kind of music).
Let the brief decide, then reuse what fits and leave the rest.
When you reuse something from an old video, say what you reused and why it fits this one.

## Read first

Check each path still exists before relying on it.

1. `C:\Users\amierashraf.hadi\Desktop\AI storage\video-making\README.md`: the rules for filing, the "Engine lessons" (GPU capture, the Edge process leak, SVG vs three.js), and the index of everything kept.
2. The video records. Read the one closest to the new job, not all of them:
   - Solar farm film (the newest, started 2026-11-24): `C:\Users\amierashraf.hadi\Desktop\AI\Solar\video\STATUS.md`. Its `video\anim\README.md` is the most current guide to the animation engine, and `video\audio\kokoro_timed.py` times picture beats to single words.
   - DAMAi + BIDS security film: `C:\Users\amierashraf.hadi\Desktop\AI\DAMAi BIDS\video\STATUS.md`.
   - Change detection showcase videos, v1 to v6 (real footage plus HTML scenes, built with ffmpeg and Python): `C:\Users\amierashraf.hadi\Desktop\AI storage\ods-change-detection-poc\video\`, with each version's `-script.md` and the build scripts in `work\`.
   - Three-tier inspection film (the first one): `C:\Users\amierashraf.hadi\Desktop\AI\ytl proposal\video\STATUS.md`.
   - Add each new video's record to this list when you start it.
3. Music: `C:\Users\amierashraf.hadi\Desktop\AI storage\video-making\music-library\README.md` (how the scores were made, levels against the voice, how to render more).
4. Voice: the "Text to speech" section of the global `~/.claude/CLAUDE.md` (Kokoro in `C:\tools\kokoro`, how to write lines that sound human).
5. Ideas from outside: `C:\Users\amierashraf.hadi\Desktop\AI storage\video-making\reference-videos\` (each with a `report\` of what we learned).

Standing rules inside a film's `STATUS.md` (for example the BIDS alarm rules or "Railway-only things") belong to that film's product and story.
Carry one over only when the new video shows the same product or claim.

## Settle the brief

Lead with a concrete guess amier can correct, not an open question.
Cover purpose and audience, length, look and medium, voice and captions, music and sound effects, what must not appear, the source of truth (if there is one), and delivery formats.
For the starting guesses, read "The brief" section of the closest past record and offer its answers as guesses, never as assumptions.

## Pick the tools by the style, not by habit

| The video needs | Start from |
|---|---|
| Drawn 2D diagrams and hardware, precise labels | The film engine: `gen\` (stills from code) and `anim\` (scenes, timeline, frame capture) copied from the closest film |
| Real 3D camera moves, terrain, particles, glow | The same engine plus a WebGL (three.js) layer, as the "Engine lessons" describe; keep text in SVG on top |
| Real footage, screen recordings, photos | ffmpeg and Python, as in the change detection videos |
| Something none of these covers | Propose the tool with the reason, and get amier's OK before building |

When you copy the film engine, apply the "Engine lessons" to the copy before its first capture: the GPU flags in `anim\lib\cdp.js` and the Edge leak fix.

## Start the project

- One folder per video: `C:\Users\amierashraf.hadi\Desktop\AI\<Video name>\video\`, with the sources (proposal, deck, pictures) in the parent folder.
- Start its own `STATUS.md` at once: brief, owner decisions, where things are, each cut with what changed. Keep it current; it is how the next session continues without amier explaining again.
- Copy only the parts that fit the new brief, and say in `STATUS.md` what was copied from where.

## Steps used so far

The steps have varied by video. Across the films they included: brief questions, a style proof (first film only), the script or its outline, storyboard stills, reviews (a Codex `gpt-6-sol` manager-view debate, and once a product review by the ODS session), narration, animation (up to three parallel Opus lanes), music samples for amier to pick by ear, numbered cuts, then the boss's change rounds.
Script, storyboard and the brief always waited for amier's OK. Later builds sometimes ran ahead of amier's listening; when that happens, say so plainly.
Scale the steps to the job and say at the start which ones you plan to use and why.

## Rules that hold for every video

- Narration uses Kokoro with the voice `af_heart` (Heart) only, unless amier says otherwise for this video.
- If there is a source document, anything the video shows or says that is not in it is listed for amier's OK. Invented values are marked "Illustrative example".
- A change to an approved script or storyboard needs amier's OK first.
- Number every cut and never overwrite one.
- Check your own output before showing it: contact sheets of the picture, and listen to or measure the sound. Say what you did not check.
- At the first real render, check which steps run on the graphics card and which on the processor (`nvidia-smi`, the browser's renderer string), and tell amier. With frame capture on the card, a whole capture run was about 1.8x faster (Engine lessons); the H.264 encode stays on the processor on purpose, for the better picture under 16 MB.

## When the video is done

- File kept output in `ai storage` only on amier's word.
  A video-only project goes in `C:\Users\amierashraf.hadi\Desktop\AI storage\video-making\<video>\`, its music in `music-library\<video>\`, with a row in that README's index.
  A video made as one part of wider work stays in that project's own `ai storage` folder, with a pointer in the video-making README.
- A lesson that will matter for other videos goes into the video-making README ("Engine lessons" or the rules), not only into the video's `STATUS.md`.
- If this skill pointed somewhere wrong or missed something, fix the skill too.
