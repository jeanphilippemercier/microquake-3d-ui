export default {
  actions: {
    LOCAL_INITIALIZE({ state }) {
      console.log('LOCAL_INITIALIZE', state);
    },
    LOCAL_UPDATE_UNCERTAINTY_SCALING({ state }) {
      console.log('LOCAL_UPDATE_UNCERTAINTY_SCALING', state);
    },
    LOCAL_UPDATE_SCALING({ state }) {
      console.log('LOCAL_UPDATE_SCALING', state);
    },
    LOCAL_UPDATE_PRESET({ state }, preset) {
      console.log('LOCAL_UPDATE_PRESET', state, preset);
    },
    LOCAL_UPDATE_RAY_FILTER_MODE({ state }) {
      console.log('LOCAL_UPDATE_RAY_FILTER_MODE', state);
    },
    LOCAL_UPDATE_EVENTS_VISIBILITY({ state }) {
      console.log('LOCAL_UPDATE_EVENTS_VISIBILITY', state);
    },
    LOCAL_UPDATE_EVENTS({ state }) {
      console.log('LOCAL_UPDATE_EVENTS', state);
    },
    LOCAL_UPDATE_MINE_VISIBILITY({ state }) {
      console.log('LOCAL_UPDATE_MINE_VISIBILITY', state);
    },
    LOCAL_EVENT_PICKING({ state }, [x, y]) {
      console.log('LOCAL_EVENT_PICKING', state, x, y);
    },
    LOCAL_UPDATE_CENTER_OF_ROTATION({ state }, position) {
      console.log('LOCAL_UPDATE_CENTER_OF_ROTATION', state, position);
    },
    LOCAL_SHOW_RAY({ state }) {
      console.log('LOCAL_SHOW_RAY', state);
    },
    LOCAL_OPEN_EVENT({ state }) {
      console.log('LOCAL_OPEN_EVENT', state);
    },
    LOCAL_RESET_CAMERA({ state }) {
      console.log('LOCAL_RESET_CAMERA', state);
    },
    LOCAL_RENDER({ state }) {
      console.log('LOCAL_RENDER', state);
    },
    LOCAL_VIEW_UP({ state }) {
      console.log('LOCAL_VIEW_UP', state);
    },
    LOCAL_ON_MINE_CHANGE({ state }, callback) {
      console.log('LOCAL_ON_MINE_CHANGE', state, callback);
    },
    LOCAL_FETCH_MINE({ state }) {
      console.log('LOCAL_FETCH_MINE', state);
    },
    LOCAL_SHOW_LOCATIONS({ state }) {
      console.log('LOCAL_SHOW_LOCATIONS', state);
    },
  },
};
