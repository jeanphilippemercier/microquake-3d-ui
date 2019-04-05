function objEnum(names) {
  const obj = {};
  names.forEach((name) => {
    obj[name] = name;
  });
  return obj;
}

// ----------------------------------------------------------------------------
// Getters
// ----------------------------------------------------------------------------

export const Getters = objEnum([
  // busy
  'BUSY_PROGRESS',
  'BUSY_COUNT',

  // index
  'APP_DARK_THEME',

  // network
  'NETWORK_CLIENT',
  'NETWORK_CONFIG',

  // quake
  'QUAKE_MINE',
  'QUAKE_MINE_VISIBILITY',
  'QUAKE_COLOR_PRESET',
  'QUAKE_COLOR_PRESETS',
  'QUAKE_SCALING_RANGE',
  'QUAKE_MAGNITUDE_RANGE',
  'QUAKE_COMPONENTS_VISIBILITY',
  'QUAKE_HISTORICAL_TIME',
  'QUAKE_FOCUS_PERIOD',
  'QUAKE_PICKING_POSITION',
  'QUAKE_PICKED_DATA',
  'QUAKE_FOCUS_PERIOD_OFFSET',
  'QUAKE_UNCERTAINTY_SCALE_FACTOR',
  'QUAKE_DOUBLE_CLICK_MODE',
  'QUAKE_RAY_FILTER_MODE',
  'QUAKE_RAYS_IN_SCENE',

  // view
  'VIEW_ID',
  'VIEW_PROXY',
  'VIEW_STATS',
  'VIEW_QUALITY_STILL',
  'VIEW_QUALITY_INTERACTIVE',
  'VIEW_RATIO_STILL',
  'VIEW_RATIO_INTERACTIVE',
  'VIEW_FPS_MAX',
  'VIEW_MOUSE_THROTTLE',
  'VIEW_ADVANCED_ORIENTATION_WIDGET',
  'VIEW_WIDGET_MANAGER',
]);

// ----------------------------------------------------------------------------
// Mutations
// ----------------------------------------------------------------------------

export const Mutations = objEnum([
  // busy
  'BUSY_PROGRESS_SET',
  'BUSY_COUNT_SET',

  // index
  'APP_DARK_THEME_SET',

  // network
  'NETWORK_CLIENT_SET',
  'NETWORK_CONFIG_SET',

  // quake
  'QUAKE_MINE_SET',
  'QUAKE_MINE_VISIBILITY_SET',
  'QUAKE_COLOR_PRESET_SET',
  'QUAKE_COLOR_PRESETS_SET',
  'QUAKE_SCALING_RANGE_SET',
  'QUAKE_MAGNITUDE_RANGE_SET',
  'QUAKE_COMPONENTS_VISIBILITY_SET',
  'QUAKE_HISTORICAL_TIME_SET',
  'QUAKE_FOCUS_PERIOD_SET',
  'QUAKE_PICKING_POSITION_SET',
  'QUAKE_PICKED_DATA_SET',
  'QUAKE_FOCUS_PERIOD_OFFSET_SET',
  'QUAKE_UNCERTAINTY_SCALE_FACTOR_SET',
  'QUAKE_DOUBLE_CLICK_MODE_SET',
  'QUAKE_RAY_FILTER_MODE_SET',
  'QUAKE_RAYS_IN_SCENE_SET',

  // view
  'VIEW_ID_SET',
  'VIEW_STATS_SET',
  'VIEW_QUALITY_STILL_SET',
  'VIEW_QUALITY_INTERACTIVE_SET',
  'VIEW_RATIO_STILL_SET',
  'VIEW_RATIO_INTERACTIVE_SET',
  'VIEW_FPS_MAX_SET',
  'VIEW_MOUSE_THROTTLE_SET',
  'VIEW_PROXY_SET',
  'VIEW_ADVANCED_ORIENTATION_WIDGET_SET',
  'VIEW_WIDGET_MANAGER_SET',
]);

// ----------------------------------------------------------------------------
// Actions
// ----------------------------------------------------------------------------

export const Actions = objEnum([
  // busy
  'BUSY_UPDATE_PROGRESS',

  // index

  // network
  'NETWORK_CONNECT',

  // quake
  'QUAKE_FETCH_MINE',
  'QUAKE_UPDATE_MINE_VISIBILITY',
  'QUAKE_UPDATE_EVENTS_VISIBILITY',
  'QUAKE_UPDATE_EVENTS',
  'QUAKE_UPDATE_PRESET',
  'QUAKE_UPDATE_SCALING',
  'QUAKE_EVENT_PICKING',
  'QUAKE_OPEN_EVENT',
  'QUAKE_UPDATE_UNCERTAINTY_SCALING',
  'QUAKE_SHOW_RAY',
  'QUAKE_UPDATE_RAY_FILTER_MODE',

  // view
  'VIEW_UPDATE_CAMERA',
  'VIEW_RESET_CAMERA',
  'VIEW_ROLL_LEFT',
  'VIEW_ROLL_RIGHT',
  'VIEW_UPDATE_ORIENTATION',
  'VIEW_RENDER',
  'VIEW_UP',
  'VIEW_TOGGLE_WIDGET_MANAGER',
]);

// ----------------------------------------------------------------------------

export default {
  Actions,
  Getters,
  Mutations,
};
