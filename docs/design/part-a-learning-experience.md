# Part A: Learning experience (design note)

Status: draft agreed on 2026-10-22. It is the basis for the Part A spec, which will be written when that block starts. Anything listed under "Open questions" is not decided yet.

## Goal

Explain Newton's law of universal gravitation to an adult with no physics background, by following the reasoning Newton himself followed: from a falling apple to the Moon's orbit. The learner should understand why the law has the shape it has, not only what it says.

## Learning objectives

By the end, the learner can explain in their own words that:

1. "Down" means "towards the centre of the Earth": every falling object falls towards the centre.
2. Attraction is mutual and equal: the apple pulls the Earth exactly as hard as the Earth pulls the apple. The Earth barely moves because its mass is enormous.
3. Attraction weakens with the square of the distance: twice as far means four times weaker.
4. An orbit is a fall that never reaches the ground: the Moon is falling towards the Earth, but it moves sideways so fast that it keeps missing it.
5. These ideas together are the law: F = G·m₁·m₂/r².

## The journey

Five short steps. Each step has one idea, one visual or interaction and one check question. The learner can always continue without answering.

### Step 1: The apple falls

- **Idea:** on a round Earth, "down" points to the centre.
- **Visual:** apples falling from trees at different points of the globe, all towards the centre.
- **Question:** "What do these two falls have in common?"
  - They both fall towards the centre of the Earth. (correct)
  - They both fall towards the bottom of the screen. (misconception: absolute "down")
  - They both fall towards the South Pole. (misconception: absolute "down")
  - Nothing, they fall in different directions. (misconception: no common cause)

### Step 2: The attraction is mutual

- **Idea:** the apple pulls the Earth with the same force. Same force, different effect: the effect depends on mass.
- **Visual:** apple and Earth with equal force arrows; the apple moves, the Earth does not visibly move.
- **Question:** "Who pulls harder, the apple or the Earth?"
  - The Earth. (misconception: bigger body pulls harder)
  - The apple. (misconception)
  - They pull exactly as hard. (correct)
- **Follow-up for the tutor:** "Then why does the apple move and the Earth doesn't?" (answer: much less mass, so the same force moves it much more).

### Step 3: Does it reach the Moon?

- **Idea:** the Moon test. The Moon is about 60 times farther from the Earth's centre than the apple, so the pull should be 60 × 60 = 3,600 times weaker. In one second, starting from rest, the apple falls about 4.9 m. In one second, the Moon "falls" towards the Earth (deviates from a straight line) about 4.9 m / 3,600 ≈ 1.4 mm, which matches its orbit. Same force on Earth and in the sky.
- **Visual:** Earth, apple and Moon at scale distances, with the fall distances compared.
- **Question:** "If the Moon were twice as far away, the pull would be…"
  - Half as strong. (misconception: linear with distance)
  - Four times weaker. (correct)
  - The same. (misconception: distance does not matter)

### Step 4: Why doesn't the Moon fall? (Newton's cannon)

- **Idea:** an orbit is falling while moving sideways fast enough to keep missing the ground.
- **Interaction:** the cannon simulator (see below).
- **Question, asked before firing (predict, observe, explain):** "What do you think will happen if you launch at 12 km/s?"
  - It falls back to Earth.
  - It goes into orbit.
  - It escapes and never comes back. (correct)
- **Question after experimenting:** "Why doesn't the Moon fall onto the Earth?"
  - There is no gravity in space. (misconception: very common, floating astronauts)
  - It does fall, but it moves sideways so fast that it never reaches the ground. (correct)
  - The Earth pushes it away. (misconception)

### Step 5: The complete law

- **Idea:** F = G·m₁·m₂/r², explaining each symbol with what the learner already saw in steps 1 to 4.
- **Question:** "If the apple had twice the mass, the force between it and the Earth would be…"
  - Twice as big. (correct)
  - Four times bigger. (misconception: confusing mass with distance)
  - The same. (misconception: mass does not matter)

## Question design

- **Single choice, one question per step.** Fast and not intimidating for someone without physics background.
- **Every wrong option maps to a known misconception.** A wrong answer tells us what the learner believes, not only that they failed.
- **Grading is deterministic and done by the app.** The correct option is known in advance, so no LLM is needed to grade.
- **Skipping is allowed.** A skipped question means "unknown", not "wrong".

## Learner profile and adaptation

- The app keeps a small profile: for each concept (fall direction, mutual attraction, inverse square, orbit as falling, the full law), whether the learner got it right, chose a specific misconception or skipped it.
- The profile lives in the app state, not in the LLM's memory. It is sent to the tutor with each message. This makes adaptation visible and testable.
- How the tutor uses it (to be detailed in the tutor spec): explaining the specific misconception, offering to skip a step when the learner already knows it, or going deeper.

## Newton's cannon simulator

Inspired by existing orbit simulators in functionality only. The visual design is our own.

**In scope**

- Launch speed and angle controls, and a launch button.
- Trajectory trail.
- Outcome label: ballistic (suborbital), circular orbit, elliptical orbit, escape.
- Presets for each outcome.
- Two reference speeds shown next to the speed control, valid near the surface and ignoring air: orbital speed ≈ 7.9 km/s and escape speed ≈ 11.2 km/s. Also shown in km/h (7.9 km/s ≈ 28,000 km/h), which means more to a non-physicist.

**Out of scope (to be stated in the README)**

- Atmospheric drag.
- CSV and PNG export.
- Other bodies (Moon, Mars) as the central body.
- Technical orbital data panel (apogee, perigee, eccentricity, period).

## The tutor (LLM)

To be detailed in its own spec. What we have agreed so far:

- Lives in a side panel next to the lesson.
- Explains, answers free questions, asks or follows up on the check questions and adapts to the learner profile.
- Can operate the app, for example setting the cannon's speed and launching it while explaining ("look what happens at 8 km/s"), or moving to a step.

## Physics accuracy notes

The tutor and the lesson text must not teach anything inaccurate. Points to watch:

- Equal forces (Newton's third law): never say the apple is "pulled with more force" or that it pulls "more weakly". The forces are equal. A 100 g apple and the Earth pull each other with about 1 N. That force gives the apple 9.8 m/s² and the Earth about 1.6 × 10⁻²⁵ m/s².
- The apple story is an anecdote Newton told late in life. Present it as such, as a narrative thread.
- Newton's real leap was universality (the same force reaches the Moon) and the inverse square, not noticing that things fall.
- Moon test numbers: Moon distance ≈ 60 Earth radii, so 3,600 times weaker. Apple: 4.9 m in one second. Moon: ≈ 1.4 mm in one second. These are distances fallen in one second, not speeds: say "in one second", never "per second".

## Implications for the physics engine

- The cannon is a two-body problem with a central body that barely moves. It is the simplest case for the engine, and the trajectory must close for circular and elliptical orbits instead of spiralling.
- The outcome label can be computed from the launch speed, angle and altitude with orbital formulas, without simulating. Escape depends only on speed and altitude (energy). Whether the trajectory hits the ground also depends on the angle.
- Collision with the Earth's surface must be detected to end ballistic trajectories.
- The same engine animates the three-body orbits in Part B.

## Open questions

- Units in the cannon simulator: real units (km, km/s) in the UI, and how they map to the engine's units.
- Whether step 2 and step 3 visuals are static illustrations with light animation, or small interactions.
- How the tutor is introduced: open from the start, or after the first question.
- Whether to add a free-text "explain it in your own words" question graded by the LLM, as an extra.
