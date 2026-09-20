---
name: geo-visibility
description: Read and act on GetCited AI answer engine visibility data (geo_summary, geo_gap actions). Use when the user asks why the brand is not cited by ChatGPT, Perplexity, Gemini, Claude or Google AI Overviews, asks about GEO, AEO or AI search visibility, mentions share of voice in AI answers, or when a geo_gap action comes off the queue.
---

# GEO visibility

AI answer engines are retrieval-augmented pipelines on top of a search index.
A prompt is decomposed into sub-queries (query fan-out), candidate passages are
retrieved from Google, Bing, Brave or the engine's own index, some are placed in
the context window, and the model writes an answer that cites a few of them.
Being retrieved and being cited are two different problems, and most of the
leverage sits in retrieval. Rewriting a page that never gets retrieved changes
nothing.

Read `geo_summary` before forming any opinion. Read `list_keywords` and
`get_site_health` too when the gap looks like an indexing or crawlability
problem.

## Reading geo_summary

`geo_summary(projectId, days)` returns one entry per tracked prompt:

- `prompt`, `promptFormat` (`keyword`, `conversational`, `list`), `funnelStage`
  (`tofu`, `mofu`, `bofu`)
- `engines[]`, one per engine, each with `runs`, `citedRuns`, `mentionedRuns`,
  `citedRate`, `mentionedRate` and the top `competitorDomains` with their run counts
- `fanoutQueries[]`, the sub-queries the engines actually issued for this prompt

There is deliberately no per-run rank. Answer ordering changes on nearly every
run, so rank is not a measurement. Frequency is.

## What counts as a gap

Engine answers are stochastic. In a 2,961-response study, the chance of two
identical brand lists in identical order was under 1 in 1,000, while frequency of
appearance was stable. A single missing citation is noise. Apply these rules:

- Ignore any engine cell with fewer than about 10 `runs`. Say the sample is too
  small rather than guessing.
- A real gap is `citedRate` at or near zero across 10 or more runs on the same
  engine, over a window of at least 14 days, while `competitorDomains` shows other
  brands being cited in those same runs. Competitor presence is what proves the
  prompt is answerable and the absence is yours.
- Compare engines separately. They run different indexes and different brand
  priors, so a gap on one engine only is an index-specific retrieval problem, not
  a content problem.
- Do not chase a drop from one window to the next unless it holds across several
  days and several prompts. Platform drift, not your site, is the usual cause.
- Judge a portfolio, not a prompt. Fifty or more prompts sampled daily is a stable
  estimate; one prompt on one day is not.

Read `mentionedRate` against `citedRate`:

| Pattern | Reading | Where the work goes |
|---|---|---|
| `mentionedRate` high, `citedRate` near zero | The model knows the brand but your page is not retrieved | Retrievability |
| Both near zero, competitors cited | Neither retrieved nor known | Retrievability, then earned mentions |
| `citedRate` up, `mentionedRate` low | Cited but the brand name is not in the cited passage | Name the brand inside the passage, not only in the H1 |

## Priority order: retrievability before wording

Work down this list. Do not skip to step 4.

1. **Be in the right index.** Google feeds AI Overviews, AI Mode and Gemini; Bing
   feeds ChatGPT and Copilot; Brave feeds Claude; Perplexity runs its own. Confirm
   sitemaps are submitted to Google and Bing and that IndexNow pings on update.
   A page missing from Bing cannot be cited by ChatGPT no matter how it is written.
2. **Let the search crawlers in.** Check `robots.txt` and any edge or WAF rules for
   Googlebot, bingbot, OAI-SearchBot, Claude-SearchBot, Claude-User, PerplexityBot
   and Applebot. These are the answer-time and index crawlers, and they are a
   separate decision from the training crawlers (GPTBot, ClaudeBot, CCBot). Blanket
   blocks measurably reduce retrieval.
3. **Server-render whatever should be cited.** AI crawlers execute no JavaScript.
   Prices, specs, dates, comparison tables and reviews that only exist after
   hydration are invisible to them. Also keep 404s and redirect chains low.
4. **Cover the fan-out.** `fanoutQueries[]` is the real sub-query list for the
   prompt. Make sure one authoritative page, or a tight hub, answers each cluster.
   Prefer one strong page per cluster over one thin page per sub-query.
5. **Rank in classic search for those sub-queries.** Page-one ranking is still the
   single strongest predictor of citation. Necessary, not sufficient.
6. **Stay genuinely fresh.** Cited pages skew substantially newer than organic
   results. Update evergreen pages on a real schedule and emit a truthful
   `dateModified`. Bumping the date without changing the content does nothing.

Only once the page is retrievable does wording matter:

7. Answer first. A direct 40 to 80 word answer under each heading, then detail.
   Citations concentrate heavily in the first third of a page.
8. Write self-contained passages. Engines chunk and embed at roughly 100 to 500
   tokens, so each section must stand alone and must name the brand or product
   inside the passage.
9. Use dense structure: descriptive headings every 100 to 180 words, lists,
   comparison tables, explicit definitions.
10. Add sourced statistics, named expert quotations, outbound citations and
    explicit prices. These are the content levers that replicate across studies.
11. Match the stance. Answers are usually one-sided. Do not hedge a direct answer.

## Off-site is often the real lever

For commercial prompts, most of the retrieval probability sits on third-party
pages, so `competitorDomains` is the most actionable field in the whole summary.
Brand web mentions correlate far more strongly with AI visibility than backlinks
or domain authority. Third-party "best X" lists, Reddit threads, YouTube videos
and review profiles inherit retrieval that a new page on your own domain has to
earn from scratch. When `competitorDomains` is dominated by listicles and forums,
say so plainly: the fix is placement and earned coverage, which is the user's
call and not a code change. Do not invent it as a repo task.

## Do not prioritize

- `llms.txt`. Almost never requested, no engine confirms using it.
- Schema markup as a citation lever. It has no measured effect on AI citations.
  Keep it accurate for rich results and product feeds, nothing more.
- Tone rewrites toward sounding "authoritative". Did not replicate.
- Keyword stuffing. Scores at or below baseline.
- Tracking rank inside AI answers. It is not a stable quantity.

## Acting on a geo_gap action

`geo_gap` actions come off `list_actions` like any other. Claim it, then confirm
the gap against `geo_summary` with the rules above before touching anything. Walk
the priority list and name the step that is actually failing. Most `geo_gap`
actions resolve to steps 1 to 5, which are infrastructure and content-coverage
changes in the repo, or to the off-site work above, which is not. Say which one it
is. Complete the action only when the repo change is in and verified, and report
that engine measurement will take days to weeks to move.
