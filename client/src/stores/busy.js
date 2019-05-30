export default {
  state: {
    count: 0,
    progress: 0,
  },
  getters: {
    BUSY_PROGRESS(state) {
      return state.progress;
    },
    BUSY_COUNT(state) {
      return state.count;
    },
  },
  mutations: {
    BUSY_PROGRESS_SET(state, value) {
      state.progress = value;
    },
    BUSY_COUNT_SET(state, value) {
      state.count = value;
    },
  },
  actions: {
    BUSY_START({ state }) {
      state.count++;
    },
    BUSY_END({ state }) {
      state.count--;
    },
  },
};
