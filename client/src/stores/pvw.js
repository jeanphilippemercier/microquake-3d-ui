export default {
  actions: {
    PVW_UPDATE_ACCESS_INFORMATION({ getters }) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_UPDATE_AUTH_TOKEN\n');
      }
      const token = getters.HTTP_AUTH_TOKEN;
      const siteCode = getters.QUAKE_SELECTED_SITE;
      const networkCode = getters.QUAKE_SELECTED_NETWORK;
      console.log(
        `Client sending message to server to update auth token: ${token}`
      );
      return client.remote.Quake.updateAccessInformation(
        token,
        siteCode,
        networkCode
      );
    },
    PVW_UPDATE_UNCERTAINTY_SCALING({ getters }, scaleFactor) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_UPDATE_UNCERTAINTY_SCALING\n');
      }
      return client.remote.Quake.updateUncertaintyScaling(scaleFactor);
    },
    PVW_UPDATE_SCALING({ getters }, [dataRange, sizeRange]) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_UPDATE_SCALING\n');
      }
      return client.remote.Quake.updateScaleFunction(dataRange, sizeRange);
    },
    PVW_UPDATE_PRESET({ getters }, preset) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_UPDATE_PRESET\n');
      }
      return client.remote.Quake.updatePreset(preset);
    },
    PVW_UPDATE_RAY_FILTER_MODE({ getters }, [prefOrigRange, arrivalRange]) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject(
          'No client for PVW_REMOTE_UPDATE_RAY_FILTER_MODE\n'
        );
      }
      return client.remote.Quake.updateRayThresholds(
        prefOrigRange,
        arrivalRange
      );
    },
    PVW_UPDATE_EVENTS_VISIBILITY({ getters }, visibilityMap) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_UPDATE_EVENTS_VISIBILITY\n');
      }
      return client.remote.Quake.updateVisibility(visibilityMap);
    },
    PVW_UPDATE_EVENTS({ getters }, [now, fTime, hTime, monitorEvents]) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_UPDATE_EVENTS\n');
      }
      return client.remote.Quake.updateEvents(now, fTime, hTime, monitorEvents);
    },
    PVW_UPDATE_MINE_VISIBILITY({ getters }, visibilityMap) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_UPDATE_MINE_VISIBILITY\n');
      }
      return client.remote.Quake.updateMineVisibility(visibilityMap);
    },
    PVW_EVENT_PICKING({ getters }, [x, y]) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_EVENT_PICKING\n');
      }
      return client.remote.Quake.pickPoint(x, y);
    },
    PVW_UPDATE_CENTER_OF_ROTATION({ getters }, position) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_UPDATE_CENTER_OF_ROTATION\n');
      }
      return client.remote.Quake.updateCenterOfRotation(position);
    },
    PVW_SHOW_RAY({ getters }, id) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_SHOW_RAY\n');
      }
      return client.remote.Quake.showRay(id);
    },
    PVW_OPEN_EVENT({ getters }, id) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_OPEN_EVENT\n');
      }
      return client.remote.Quake.getEventId(id);
    },
    PVW_RESET_CAMERA({ getters }) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_RESET_CAMERA\n');
      }
      return client.remote.Quake.resetCamera();
    },
    PVW_RENDER({ getters }) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_RENDER\n');
      }
      return client.remote.Quake.render();
    },
    PVW_VIEW_UP({ getters }) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_VIEW_UP\n');
      }
      return client.remote.Quake.snapCamera();
    },
    PVW_ON_MINE_CHANGE({ getters }, callback) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_ON_MINE_CHANGE\n');
      }
      return client.remote.Quake.onMineChange(callback);
    },
    PVW_FETCH_MINE({ getters }) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_FETCH_MINE\n');
      }
      return client.remote.Quake.getMineDescription();
    },
    PVW_SHOW_LOCATIONS({ getters }, locations) {
      const client = getters.REMOTE_CLIENT;
      if (!client) {
        return Promise.reject('No client for PVW_SHOW_LOCATIONS\n');
      }
      return client.remote.Quake.showEventLocations(locations);
    },
  },
};
