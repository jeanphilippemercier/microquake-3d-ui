import { Actions, Mutations } from 'paraview-quake/src/stores/TYPES';

export default {
  name: 'HistoricalPeriod',
  computed: {
    historicalTime: {
      get() {
        return this.$store.getters.QUAKE_HISTORICAL_TIME;
      },
      set(value) {
        this.$store.commit(Mutations.QUAKE_HISTORICAL_TIME_SET, value);
        this.$store.dispatch(Actions.QUAKE_UPDATE_EVENTS);
      },
    },
  },
};
