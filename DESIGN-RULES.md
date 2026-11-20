---
name: Delightful design
description: >-
  Use this when planning, building, reviewing or polishing anything people will
  see or use (web pages, 3D experiences, apps, tools) so it ends up beautiful,
  captivating, pleasant and effortless to use.
---
# Delightful design

This skill is the design standard for anything a person will see and use. It has two layers. The universal feel rules apply every time. A fresh visual style is chosen for each project. Use it at four points: plan, first slice, final polish and learn. Don't leave design until the end.

It is built from the fundamentals used by the strongest design teams: Apple's Human Interface Guidelines (clarity, deference, depth), Google Material (motion with meaning, clear hierarchy), Nielsen Norman's usability heuristics, Dieter Rams' ten principles of good design, IDEO's human-centered design, and the craft of products like Linear, Stripe, Airbnb and Bruno Simon-style 3D web work.

## Layer 1: universal feel rules (every project)

**Clarity**
- A first-time user knows what to do within 5 seconds, without reading instructions.
- Each screen has one main action, and everything else is visually quieter.
- There is a clear order of importance: one hero, a few supporting elements, details on demand.
- Use plain words in labels, never jargon.

**Effortless use**
- Every tap, click or drag gets instant feedback within about 100ms, such as a highlight, glow, sound or small bounce.
- Targets are big (at least 44px), with comfortable spacing that works with a thumb on a phone.
- Mistakes are hard to make and easy to undo. There are no dead ends, and a way back or a reset is always visible.
- Teach by doing. Show one hint at the moment it's needed, never a wall of instructions.
- Behavior stays consistent: the same gesture or button always does the same thing.

**Beauty and calm**
- Leave generous whitespace, use few colors, and give content room to breathe.
- Use at most 2 typefaces and a clear type scale, with body text easy to read on a phone.
- Every element earns its place. If removing something loses nothing, remove it (Rams: as little design as possible).
- Lighting, shadows and materials in 3D feel soft and intentional, never harsh or default.

**Motion**
- Motion explains what changed and where things went. It is never decoration for its own sake.
- Use natural easing (spring or ease-out), mostly 200–400ms, and never let it feel jumpy or laggy.
- Hold a steady 60fps on a normal phone. Cut effects before cutting smoothness.
- Respect reduced-motion settings.

**Delight**
- Give each project one memorable wow moment, designed on purpose, with a calm stage around it.
- Add small rewards for progress, such as a satisfying sound, sparkle or reveal.
- Make the first 5 seconds beautiful on their own, before any interaction.

**Respect**
- The first view loads fast (aim for under 3 seconds), with a pleasant loading state.
- Text has strong contrast, and color never carries meaning on its own.
- It works on phone and desktop, in portrait and landscape.
- Nothing manipulates the user: no dark patterns and no nagging.

## Layer 2: per-project style (chosen fresh in the plan stage)

The look should fit the topic and the audience, never a house style. For each project:
1. Name the audience and the feeling, such as "curious 12-year-olds, playful wonder" or "adults planning a room, calm and premium".
2. Gather 3–4 strong reference designs that fit, such as award-winning sites (Awwwards, FWA), the top products in that space and real-world inspiration.
3. Turn them into a one-page style card covering palette (3–5 colors with roles), type pairing, lighting and material mood, motion personality (snappy, floaty or bouncy), sound mood, and the wow moment.
4. Get the owner's quick approval of the style card along with the spec, before code.

## When to apply

1. **Plan.** The spec includes a "Feel" section: audience and feeling, the first 5 seconds, a 3-step path to the wow moment, and the style card.
2. **First slice (midway).** Build only the hero scene and the main interaction at full polish first. Review screenshots or a short recording against Layer 1 and the style card, and show the owner. Change direction here, while it's cheap.
3. **Final polish.** Run a first-time-user test, acting as the real audience with no instructions. Score clarity, ease, beauty, smoothness and delight from 1 to 5, and fix anything under 4. Then check phone sizes, load time, 60fps, contrast and the undo and reset paths.
4. **Learn.** Write down what the owner loved or rejected and why, and fold lasting lessons into the project-type notes so the next build starts higher.

## Quick review checklist
- [ ] Clear in 5 seconds, with no instructions needed
- [ ] One main action per screen
- [ ] Instant feedback on every interaction
- [ ] Undo or reset is always available
- [ ] Calm layout, at most 2 fonts, and a palette that matches the style card
- [ ] Motion explains, runs smoothly at 60fps, and respects reduced motion
- [ ] One designed wow moment
- [ ] Fast first load on a phone
- [ ] Readable contrast, with phone and desktop both checked
