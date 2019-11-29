import { mapGetters } from 'vuex';

export default {
  name: 'NotificationToast',
  computed: {
    ...mapGetters({
      notifications: 'QUAKE_NOTIFICATIONS',
    }),
  },
};
