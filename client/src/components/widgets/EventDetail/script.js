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
    typeMapping: {
      type: Object,
      default: () => ({}),
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
    eventType() {
      if (this.event.event_type && this.typeMapping[this.event.event_type]) {
        return this.typeMapping[this.event.event_type].text;
      }
      return this.event.event_type;
    },
    eventTypeShort() {
      if (this.event.event_type && this.typeMapping[this.event.event_type]) {
        return this.typeMapping[this.event.event_type].value;
      }
      return null;
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
