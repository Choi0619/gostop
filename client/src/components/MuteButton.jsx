import { useState } from 'react';
import { isMuted, toggleMute } from '../game/sound';

export default function MuteButton() {
  const [muted, setMuted] = useState(isMuted());
  return (
    <button className="mute-btn" title={muted ? '소리 켜기' : '음소거'}
      onClick={() => setMuted(toggleMute())}>
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
