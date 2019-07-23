function getWaveformURLForEvent(id) {
  return `https://waveform.microquake.org/dashboard?id=${encodeURI(id)}`;
}

export default {
  getWaveformURLForEvent,
};
