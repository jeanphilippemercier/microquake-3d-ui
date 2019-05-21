export default {
  name: 'LoginModal',
  computed: {
   userName: {
      get() {
        return this.$store.getters.APP_AUTH_USER_NAME;
      },
      set(value) {
        this.$store.commit('APP_AUTH_USER_NAME_SET', value);
      },
    },
    userPassword: {
      get() {
        return this.$store.getters.APP_AUTH_USER_PASSWORD;
      },
      set(value) {
        this.$store.commit('APP_AUTH_USER_PASSWORD_SET', value);
      },
    },
  },
  methods: {
    performLogin() {
      const username = this.$store.getters.APP_AUTH_USER_NAME;
      const password = this.$store.getters.APP_AUTH_USER_PASSWORD;

      console.log(`Authenticate: username = ${username}, password = ${password}`);

      this.$store.dispatch('HTTP_AUTHENTICATE')
        .then((result) => {
          console.log('Authenticated');
          console.log(result);
          this.$store.commit('HTTP_AUTH_TOKEN_SET', result.data.token);
          console.log('Stored auth token, about to dispatch HTTP_FETCH_SITES');
          this.$store.dispatch('HTTP_FETCH_SITES')
            .then((sitesResponse) => {
              console.log('Got sites json:');
              console.log(sitesResponse.data);
              this.$store.dispatch('QUAKE_UPDATE_SITES', sitesResponse.data);
            })
            .catch((siteError) => {
              console.error('Error fetching sites:');
              console.error(siteError);
            });
        })
        .catch((error) => {
          console.error('Authentication failure');
          console.error(error);
        });
    },
  },
};
