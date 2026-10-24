import { es } from "@/content/es";
import type { DetailPreferences } from "./detail-preferences";
import { PLAYBACK_SPEEDS } from "./speed";

const { player } = es.detail;

const TOGGLES = [
  { preference: "showPath", label: player.showPath },
  { preference: "showTrail", label: player.showTrail },
  { preference: "correction", label: player.correction },
] as const;

/**
 * Native buttons, radio buttons and checkboxes, so every control works from
 * the keyboard (spec 03, Decision 11). Disabled until the page hydrates: a
 * click before then would be lost.
 */
export function PlayerControls({
  playing,
  collided,
  hydrated,
  preferences,
  onPlayingChange,
  onRestart,
  onPreferencesChange,
}: {
  playing: boolean;
  collided: boolean;
  hydrated: boolean;
  preferences: DetailPreferences;
  onPlayingChange: (playing: boolean) => void;
  onRestart: () => void;
  onPreferencesChange: (preferences: DetailPreferences) => void;
}) {
  return (
    <fieldset disabled={!hydrated} className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onPlayingChange(!playing)}
          // A collision stops the animation; only restarting goes on.
          disabled={collided}
          className="rounded-[10px] bg-accent px-4 py-2 text-bg-bottom disabled:opacity-50"
        >
          {playing && !collided ? player.pause : player.play}
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-[10px] border border-line bg-surface px-4 py-2 text-strong hover:bg-surface-raised"
        >
          {player.restart}
        </button>
      </div>
      <fieldset>
        <legend className="text-small text-muted">{player.speed}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {PLAYBACK_SPEEDS.map((speed) => (
            <label
              key={speed}
              className="relative flex items-center rounded-[10px] border border-line px-3 py-2 text-small hover:text-strong has-checked:border-accent/40 has-checked:bg-surface-raised has-checked:text-strong"
            >
              {/* Invisible but covering the label: it takes the clicks, and the focus ring outlines the whole option. */}
              <input
                type="radio"
                name="speed"
                checked={preferences.speed === speed}
                onChange={() => onPreferencesChange({ ...preferences, speed })}
                className="absolute inset-0 cursor-pointer appearance-none rounded-[10px]"
              />
              {player.speedOption(speed)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-1">
        {TOGGLES.map(({ preference, label }) => (
          <label
            key={preference}
            className="flex min-h-6 cursor-pointer items-center gap-3 hover:text-strong"
          >
            <input
              type="checkbox"
              checked={preferences[preference]}
              onChange={(event) =>
                onPreferencesChange({
                  ...preferences,
                  [preference]: event.target.checked,
                })
              }
              className="size-4 cursor-pointer accent-accent"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
