function getWaveformURLForEvent(id) {
  return `https://waveform.microquake.org/events/${encodeURIComponent(id)}`;
}

export default {
  getWaveformURLForEvent,
};
