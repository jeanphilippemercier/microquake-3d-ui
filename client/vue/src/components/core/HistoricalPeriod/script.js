export default {
  name: 'HistoricalPeriod',
  computed: {
    historicalTime: {
      get() {
        return this.$store.getters.QUAKE_HISTORICAL_TIME;
      },
      set(value) {
        this.$store.commit('QUAKE_HISTORICAL_TIME_SET', value);
        this.$store.dispatch('API_UPDATE_EVENTS');
      },
    },
  },
};
