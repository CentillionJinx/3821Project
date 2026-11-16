import { useEffect, useId, useRef, useState } from 'react';
import {
  injectHairlineStyles,
  mk,
  rangeValue,
  tour as startTour,
  type HairlineFigureSpec,
  type HairlineHandle,
} from '../logic/hairlineEngine.ts';

interface HairlineStageProps {
  figure: HairlineFigureSpec;
  variant?: 'compact' | 'full';
  onPick?: (index: number) => void;
  showCaption?: boolean;
}

export function HairlineStage({
  figure,
  variant = 'compact',
  onPick,
  showCaption = true,
}: HairlineStageProps) {
  return (
    <HairlineStageInner
      key={figure.name}
      figure={figure}
      variant={variant}
      onPick={onPick}
      showCaption={showCaption}
    />
  );
}

function HairlineStageInner({
  figure,
  variant = 'compact',
  onPick,
  showCaption = true,
}: HairlineStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HairlineHandle | null>(null);
  const tourRef = useRef<{ stop: () => void } | null>(null);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  const sliderId = useId();
  const [intensity, setIntensity] = useState<number>(0.5);
  const [readout, setReadout] = useState<string>('rest');
  const [playing, setPlaying] = useState<boolean>(false);

  const mappedValue = rangeValue(figure.range, intensity);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    injectHairlineStyles(document);
    stage.replaceChildren();
    stage.setAttribute('data-hairline', figure.name);
    stage.setAttribute('aria-label', figure.means);

    const svg = mk('svg', { viewBox: '0 0 400 320', 'aria-hidden': 'true' }, stage);
    let currentText: string | null = 'rest';

    const read = {
      get textContent() {
        return currentText;
      },
      set textContent(next: string | null) {
        const clean = next == null ? '' : String(next);
        currentText = clean;
        setReadout(clean);
      },
    };

    const handle = figure.mount(
      {
        stage,
        svg,
        read,
        onPick: (index) => onPickRef.current?.(index),
      },
      rangeValue(figure.range, 0.5),
    );
    handleRef.current = handle;

    return () => {
      tourRef.current?.stop();
      tourRef.current = null;
      handle.destroy();
      handleRef.current = null;
      stage.replaceChildren();
    };
  }, [figure]);

  useEffect(() => {
    handleRef.current?.set(mappedValue);
  }, [mappedValue]);

  const handleToggleTour = () => {
    const stage = stageRef.current;
    if (!stage) return;
    if (playing) {
      tourRef.current?.stop();
      tourRef.current = null;
      setPlaying(false);
    } else {
      tourRef.current = startTour(stage, figure.tour);
      setPlaying(true);
    }
  };

  return (
    <div className={`hairline-card ${variant === 'full' ? 'hairline-card-full' : ''}`}>
      <div className="hairline-plate">
        <span className="hairline-tag hairline-tag-left">{figure.name}</span>
        <span className="hairline-tag hairline-tag-right" aria-live="polite">
          {readout}
        </span>
        <div ref={stageRef} className="hairline-stage-box" tabIndex={0} />
      </div>

      <div className="hairline-controls">
        <label className="hairline-ctrl-label" htmlFor={sliderId}>
          {figure.rangeLabel}
        </label>
        <input
          id={sliderId}
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          className="hairline-slider"
        />
        <output className="hairline-ctrl-val" htmlFor={sliderId}>
          {mappedValue}
        </output>
        <button
          type="button"
          className={`btn hairline-tour-btn ${playing ? 'accent-solid' : ''}`}
          aria-pressed={playing}
          onClick={handleToggleTour}
          title="Animate pointer tour across model stops"
        >
          {playing ? 'Stop' : 'Tour'}
        </button>
      </div>

      {showCaption && <p className="hairline-means">{figure.means}</p>}
    </div>
  );
}
