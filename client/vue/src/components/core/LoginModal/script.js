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
          this.$store.dispatch('API_INITIALIZE');
        })
        .catch((error) => {
          console.log('Authentication failure');
          console.log(error);
        });
    },
  },
};
