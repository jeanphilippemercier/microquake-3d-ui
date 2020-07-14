// ---------------------------------------------------------------------------
// Helper functions
// ---------------------------------------------------------------------------

const TIME_UNITS = [
  { label: 'month', labelPlurial: 'months', base: 30 },
  { label: 'week', labelPlurial: 'weeks', base: 7 },
  { label: 'day', labelPlurial: 'days', base: 1 },
];

// ---------------------------------------------------------------------------

function getShortTimeLabel(nbOfDaysFromNow) {
  if (nbOfDaysFromNow < 1) {
    return 'now';
  }
  let remain = nbOfDaysFromNow;
  const strBuffer = [];
  for (let i = 0; i < TIME_UNITS.length; i++) {
    const { label, labelPlurial, base } = TIME_UNITS[i];
    if (remain >= base) {
      strBuffer.push(Math.floor(remain / base));
      strBuffer.push(remain / base >= 2 ? labelPlurial : label);
      remain %= base;
    }
  }
  return strBuffer.join(' ');
}

// ---------------------------------------------------------------------------

function pad(number) {
  if (number < 10) {
    return `0${number}`;
  }
  return `${number}`;
}

// ---------------------------------------------------------------------------

function getUTCDate(date) {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  return `${year}-${month}-${day}`;
}

// ---------------------------------------------------------------------------

function getUTCDateWithHours(date) {
  const year = date.getUTCFullYear();
  const month = pad(date.getUTCMonth() + 1);
  const day = pad(date.getUTCDate());
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// ---------------------------------------------------------------------------

function getMidnightMineDate(date, offset) {
  return new Date(`${date}T00:00:00.000${offset}`);
}

// ---------------------------------------------------------------------------

function offsetTime(date, offsetMS) {
  return new Date(date.getTime() + offsetMS);
}

const DAY_MS = 24 * 60 * 60 * 1000;
const THREE_MONTHS_MS = 90 * DAY_MS;

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export default {
  state: {
    mineOffset: '',
    focusBoundTime: null,
    defaultFocusRangeInMonth: 3, // 3 months
    defaultLiveModeFocusPeriod: 7, // 7 days
    focusStartDay: 0,
    focusEndDay: -1,
  },
  getters: {
    MINE_OFFSET(state) {
      return state.mineOffset;
    },
    MINE_OFFSET_MS(state, getters) {
      const strOffset = getters.MINE_OFFSET;
      const [hours, min] = strOffset.split(':').map(Number);
      const sign = hours < 0 ? -1 : +1;
      let offsetInMS = 0;
      offsetInMS += min * 60000;
      offsetInMS += Math.abs(hours) * 60 * 60000;
      offsetInMS *= sign;
      return offsetInMS;
    },
    DATE_IS_LIVE(state) {
      return state.focusEndDay < 0;
    },
    DATE_FOCUS_BOUND_TIME(state, getters) {
      const str = state.focusBoundTime;
      if (str) {
        return getMidnightMineDate(str, getters.MINE_OFFSET);
      }
      const now = new Date();
      now.setMonth(now.getMonth() - state.defaultFocusRangeInMonth);
      return now;
    },
    DATE_FOCUS_PERIOD_MAX(state, getters) {
      const start = getters.DATE_FOCUS_BOUND_TIME;
      const end = new Date();
      return Math.ceil((end.getTime() - start.getTime()) / 86400000); // 24 * 60 * 60 * 1000 == 1 day in ms
    },
    DATE_FOCUS_START_DAY(state) {
      return state.focusStartDay;
    },
    DATE_FOCUS_END_DAY(state, getters) {
      const days = state.focusEndDay;
      const maxValue = getters.DATE_FOCUS_PERIOD_MAX;
      if (days < 0) {
        return maxValue;
      }
      return Math.min(days, maxValue);
    },
    DATE_FOCUS_START_TIME(state, getters) {
      const t0 = getters.DATE_FOCUS_BOUND_TIME;
      if (state.focusStartDay) {
        return new Date(t0.getTime() + DAY_MS * state.focusStartDay);
      }
      return t0;
    },
    DATE_FOCUS_END_TIME(state, getters) {
      if (state.focusEndDay < 0) {
        return new Date();
      }
      const t0 = getters.DATE_FOCUS_BOUND_TIME;
      return new Date(t0.getTime() + DAY_MS * state.focusEndDay);
    },
    DATE_FOCUS_MIN_LABEL(state, getters) {
      const mineTime = getters.DATE_FOCUS_START_TIME;
      // Shift utc to look like mine time
      return getUTCDate(offsetTime(mineTime, getters.MINE_OFFSET_MS));
    },
    DATE_FOCUS_MAX_LABEL(state, getters) {
      if (state.focusEndDay < 0) {
        // We follow the live time
        return getUTCDateWithHours(
          offsetTime(new Date(), getters.MINE_OFFSET_MS)
        );
      }
      const mineTime = getters.DATE_FOCUS_END_TIME;
      // Shift utc to look like mine time
      return getUTCDate(offsetTime(mineTime, getters.MINE_OFFSET_MS));
    },
    DATE_FOCUS_MIN_DURATION_LABEL(state, getters) {
      const start = getters.DATE_FOCUS_START_TIME;
      // 24 * 60 * 60 * 1000 == 1 day in ms
      const delta = (Date.now() - start.getTime()) / 86400000;
      return getShortTimeLabel(delta);
    },
    DATE_FOCUS_MAX_DURATION_LABEL(state, getters) {
      const start = getters.DATE_FOCUS_END_TIME;
      // 24 * 60 * 60 * 1000 == 1 day in ms
      const delta = (Date.now() - start.getTime()) / 86400000;
      return getShortTimeLabel(delta);
    },
  },
  mutations: {
    MINE_OFFSET_SET(state, value) {
      state.mineOffset = value;
    },
    DATE_FOCUS_START_DAY_SET(state, value) {
      state.focusStartDay = value;
    },
    DATE_FOCUS_END_DAY_SET(state, value) {
      state.focusEndDay = value;
    },
    DATE_FOCUS_BOUND_TIME_SET(state, value) {
      state.focusBoundTime = value;
    },
  },
  actions: {
    DATE_FOCUS_UPDATE_START_DAY({ state, getters, commit }, value) {
      const maxValue = getters.DATE_FOCUS_PERIOD_MAX;
      const startValue = Math.max(0, Math.min(value, maxValue - 1));
      const endValue = state.focusEndDay;
      commit('DATE_FOCUS_START_DAY_SET', startValue);
      if (startValue > 0 && startValue > endValue && endValue >= 0) {
        if (startValue + 1 > maxValue) {
          commit('DATE_FOCUS_END_DAY_SET', -1);
        } else {
          commit('DATE_FOCUS_END_DAY_SET', startValue + 1);
        }
      }
    },
    DATE_FOCUS_UPDATE_END_DAY({ state, getters, commit }, value) {
      const maxValue = getters.DATE_FOCUS_PERIOD_MAX;
      const startValue = state.DATE_FOCUS_START_DAY;
      if (value >= maxValue) {
        commit('DATE_FOCUS_END_DAY_SET', -1);
      } else {
        commit('DATE_FOCUS_END_DAY_SET', value);
      }

      if (value < startValue) {
        commit('DATE_FOCUS_START_DAY_SET', Math.max(0, value - 1));
      }
    },
    DATE_FOCUS_LIVE_START_DATE({ state, getters, dispatch }) {
      const liveStartDate = getUTCDate(
        offsetTime(
          new Date(Date.now() - DAY_MS * state.defaultLiveModeFocusPeriod),
          getters.MINE_OFFSET_MS
        )
      );
      dispatch('DATE_FOCUS_UPDATE_START_DATE', liveStartDate);
    },
    DATE_FOCUS_UPDATE_START_DATE({ state, getters, commit, dispatch }, value) {
      const now = Date.now();
      const tBound = getters.DATE_FOCUS_BOUND_TIME;
      const t0 = getMidnightMineDate(value, getters.MINE_OFFSET);
      const endDayTime = getters.DATE_FOCUS_END_TIME;
      let needToUpdateEndDay = false;

      // Extend focus if date is bigger than the current bounds
      if (t0.getTime() < tBound.getTime()) {
        needToUpdateEndDay = true;
        // We need to extend the range
        commit(
          'DATE_FOCUS_BOUND_TIME_SET',
          getUTCDate(offsetTime(t0, getters.MINE_OFFSET_MS))
        );
        dispatch('DATE_FOCUS_UPDATE_START_DAY', 0);
      }

      // Shrink bounds up to 3 months
      if (t0.getTime() > tBound.getTime()) {
        needToUpdateEndDay = true;
        if (now - t0.getTime() < THREE_MONTHS_MS) {
          commit('DATE_FOCUS_BOUND_TIME_SET', null);
        } else {
          commit(
            'DATE_FOCUS_BOUND_TIME_SET',
            getUTCDate(offsetTime(t0, getters.MINE_OFFSET_MS))
          );
        }
      }

      // Update day offset based on new bounds
      const tBoundNew = getters.DATE_FOCUS_BOUND_TIME;
      const nbDays = Math.round((t0.getTime() - tBoundNew.getTime()) / DAY_MS);
      dispatch('DATE_FOCUS_UPDATE_START_DAY', nbDays);

      if (needToUpdateEndDay && state.focusEndDay >= 0) {
        const nbDaysEnd = Math.round(
          (endDayTime.getTime() - tBoundNew.getTime()) / DAY_MS
        );
        dispatch('DATE_FOCUS_UPDATE_END_DAY', nbDaysEnd);
      }
    },
    DATE_FOCUS_UPDATE_END_DATE({ getters, dispatch }, value) {
      const t1 = getMidnightMineDate(value, getters.MINE_OFFSET);
      const tBound = getters.DATE_FOCUS_BOUND_TIME;
      const nbDays = Math.round((t1.getTime() - tBound.getTime()) / DAY_MS);
      if (nbDays < 0) {
        dispatch('DATE_FOCUS_UPDATE_START_DATE', value);
        dispatch('DATE_FOCUS_UPDATE_END_DAY', 0);
      } else {
        dispatch('DATE_FOCUS_UPDATE_END_DAY', nbDays);
      }
    },
  },
};
