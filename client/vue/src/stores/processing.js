export default {
  state: {
    mode: 'LOCAL',
  },
  getters: {
    API_RENDER_MODE(state) {
      return state.mode;
    },
    API_LOCAL_RENDERING(state) {
      return state.mode === 'LOCAL';
    },
  },
  mutations: {
    API_RENDER_MODE_SET(state, value) {
      state.mode = value;
    },
    API_LOCAL_RENDERING_SET(state, value) {
      state.mode = value ? 'LOCAL' : 'REMOTE';
    },
  },
  actions: {
    API_INITIALIZE({ state, dispatch }) {
      console.log(' !!! Triggering application init !!!');
      return dispatch(`${state.mode}_INITIALIZE`);
    },
    API_UPDATE_UNCERTAINTY_SCALING({ state, dispatch }) {
      return dispatch(`${state.mode}_UPDATE_UNCERTAINTY_SCALING`);
    },
    API_UPDATE_SCALING({ state, dispatch }) {
      return dispatch(`${state.mode}_UPDATE_SCALING`);
    },
    API_UPDATE_PRESET({ state, dispatch }, preset) {
      return dispatch(`${state.mode}_UPDATE_PRESET`, preset);
    },
    API_UPDATE_RAY_FILTER_MODE({ state, dispatch }) {
      return dispatch(`${state.mode}_UPDATE_RAY_FILTER_MODE`);
    },
    API_UPDATE_EVENTS_VISIBILITY({ state, dispatch }) {
      return dispatch(`${state.mode}_UPDATE_EVENTS_VISIBILITY`);
    },
    API_UPDATE_EVENTS({ state, dispatch }) {
      return dispatch(`${state.mode}_UPDATE_EVENTS`);
    },
    API_UPDATE_MINE_VISIBILITY({ state, dispatch }) {
      return dispatch(`${state.mode}_UPDATE_MINE_VISIBILITY`);
    },
    API_EVENT_PICKING({ state, dispatch }, [x, y]) {
      return dispatch(`${state.mode}_EVENT_PICKING`, [x, y]);
    },
    API_UPDATE_CENTER_OF_ROTATION({ state, dispatch }, position) {
      return dispatch(`${state.mode}_UPDATE_CENTER_OF_ROTATION`, position);
    },
    API_SHOW_RAY({ state, dispatch }) {
      return dispatch(`${state.mode}_SHOW_RAY`);
    },
    API_OPEN_EVENT({ state, dispatch }) {
      return dispatch(`${state.mode}_OPEN_EVENT`);
    },
    API_RESET_CAMERA({ state, dispatch }) {
      return dispatch(`${state.mode}_RESET_CAMERA`);
    },
    API_RENDER({ state, dispatch }) {
      return dispatch(`${state.mode}_RENDER`);
    },
    API_VIEW_UP({ state, dispatch }) {
      return dispatch(`${state.mode}_VIEW_UP`);
    },
    API_ON_MINE_CHANGE({ state, dispatch }, callback) {
      return dispatch(`${state.mode}_ON_MINE_CHANGE`, callback);
    },
    API_FETCH_MINE({ state, dispatch }) {
      return dispatch(`${state.mode}_FETCH_MINE`);
    },
    API_SHOW_LOCATIONS({ state, dispatch }, locations) {
      return dispatch(`${state.mode}_SHOW_LOCATIONS`, locations);
    },
    API_ACTIVATE_EVENT({ state, dispatch }, id) {
      return dispatch(`${state.mode}_ACTIVATE_EVENT`, id);
    },
  },
};
