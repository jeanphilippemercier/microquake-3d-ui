function getWaveformURLForEvent(id) {
  return `https://waveform.microquake.org/?id=${encodeURI(id)}`;
}

export default {
  getWaveformURLForEvent,
};
