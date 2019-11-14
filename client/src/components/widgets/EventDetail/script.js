import * as moment from 'moment';
import DateHelper from 'paraview-quake/src/util/DateHelper';

export default {
  name: 'EventDetail',
  props: {
    event: {
      type: Object,
      default: () => null,
    },
    dark: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    headerClass() {
      return this.dark ? 'darken-2' : 'lighten-1';
    },
    toHour() {
      return moment(this.event.time_utc)
        .add(DateHelper.getOffsetTime())
        .utc()
        .format('HH:mm:ss');
    },
    toMs() {
      return moment(this.event.time_utc)
        .add(DateHelper.getOffsetTime())
        .utc()
        .format('.SSS');
    },
    toDate() {
      return moment(this.event.time_utc)
        .add(DateHelper.getOffsetTime())
        .utc()
        .format('MMM Do YYYY');
    },
  },
  methods: {
    close() {
      this.$emit('close');
    },
  },
  filters: {
    eventMagnitude(v) {
      if (!v) {
        return null;
      }
      return Number(v).toFixed(1);
    },
    decentNumber(v) {
      if (!v) {
        return '-';
      }
      return Number(v).toFixed(2);
    },
  },
};
