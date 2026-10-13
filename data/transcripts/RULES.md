# Transcript rules

Every transcript published on an episode page goes through `scripts/clean-transcript.js` before it is committed. The page renders the cleaned file. It does not reword anyone.

```
node scripts/clean-transcript.js --slug <episode-slug> --in <raw.txt>
```

A batch from the corpus uses a JSON map of filename to episode slug:

```
node scripts/clean-transcript.js --raw-dir transcripts --map data/transcripts/manifest.json
```

Raw lines look like `Josh (00:00)` followed by the spoken words. The slug is the episode slug, and the cleaned file is `data/transcripts/<slug>.txt`. Episodes with no file show no transcript section.

## Trim to the conversation

Remove show intros, sponsor or ad reads, outro sign-offs, and music cues. The transcript starts on the first turn of the conversation and ends on the last one. Leave goodbyes that are part of the interview. Do not cut a real answer to make the edges shorter. Uncertain trims remove the larger edge and are marked in `CHANGES.md`.

## Remove retakes

Remove every place the guest or host asks to retake, redo, cut, remove, strike, go off the record, or keep something out of the episode. Remove the request and the passage it refers to, including a false start. Keep the final clean take.

Search for retake, redo, start over, take that again, say that again, cut that, edit that out, remove that, scratch that, strike that, off the record, don't use that, don't include that, let me rephrase, from the top, and the same idea in other words. Then read the surrounding turns. A business sentence such as "we had to start over with the recipe" or "don't use as much salt" stays.

When the request does not make the span obvious, remove the larger span and mark it uncertain in `CHANGES.md`. The log records the episode, the approximate timestamp, and a short reason. It does not include the removed words.

## Names

Correct only an obvious mishearing of a name or brand, such as "Union Economics" to "Unit Economics", or a guest or company name spelled as it is in the episode metadata. Never reword anything else. Each correction is counted in `CHANGES.md`.

## Check

`npm test` fails if a committed transcript still contains a retake request. The patterns live in `src/lib/transcriptClean.js`.
