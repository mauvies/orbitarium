import { es } from "@/content/es";
import type { DetailPreferences } from "./detail-preferences";
import { PLAYBACK_SPEEDS } from "./speed";

const { player } = es.detail;

const TOGGLES = [
  { preference: "showPath", label: player.showPath },
  { preference: "showTrail", label: player.showTrail },
  { preference: "correction", label: player.correction },
] as const;

const OPTION_CLASSES =
  "relative flex items-center rounded-[10px] border border-line px-3 py-2 text-small hover:text-strong has-checked:border-accent/60 has-checked:bg-surface-raised has-checked:text-strong";

const OPTION_INPUT_CLASSES =
  "absolute inset-0 cursor-pointer appearance-none rounded-[10px]";

interface Props {
  playing: boolean;
  collided: boolean;
  hydrated: boolean;
  preferences: DetailPreferences;
  onPlayingChange: (playing: boolean) => void;
  onRestart: () => void;
  onPreferencesChange: (preferences: DetailPreferences) => void;
}

export function PlayerControls({
  playing,
  collided,
  hydrated,
  preferences,
  onPlayingChange,
  onRestart,
  onPreferencesChange,
}: Props) {
  return (
    <fieldset
      disabled={!hydrated}
      aria-label={player.controls}
      className="flex w-full max-w-180 flex-wrap items-center justify-between gap-x-6 gap-y-3"
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPlayingChange(!playing)}
          // A collision stops the animation; only restarting goes on.
          disabled={collided}
          className="rounded-[10px] bg-accent px-3 py-2 text-bg-bottom text-small disabled:opacity-50"
        >
          {playing && !collided ? player.pause : player.play}
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-[10px] border border-line bg-surface px-3 py-2 text-small text-strong hover:bg-surface-raised"
        >
          {player.restart}
        </button>
      </div>
      <fieldset>
        <legend className="sr-only">{player.speed}</legend>
        <div className="flex gap-2">
          {PLAYBACK_SPEEDS.map((speed) => (
            <label key={speed} className={OPTION_CLASSES}>
              <input
                type="radio"
                name="speed"
                checked={preferences.speed === speed}
                onChange={() => onPreferencesChange({ ...preferences, speed })}
                className={OPTION_INPUT_CLASSES}
              />
              {player.speedOption(speed)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex gap-2">
        {TOGGLES.map(({ preference, label }) => (
          <label key={preference} className={OPTION_CLASSES}>
            <input
              type="checkbox"
              checked={preferences[preference]}
              onChange={(event) =>
                onPreferencesChange({
                  ...preferences,
                  [preference]: event.target.checked,
                })
              }
              className={OPTION_INPUT_CLASSES}
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
