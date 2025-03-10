import Vue from "vue";
import Vuex from "vuex";
import router from "@/router";
import { db, auth } from "@/firebase/init.js";

Vue.use(Vuex);

let defaultSetup = (user, context) => {
  user.getIdTokenResult(true).then(result => {
    context.commit("setAdmin", result.claims.admin);
    context.commit("setAdminValidation", result.claims.admin);
  });
};
export default new Vuex.Store({
  state: {
    user: null,
    isAdmin: null,
    adminValidation: null,
    errorMsg: null,
    snapshot: null,
    type: null
  },
  mutations: {
    setUser: (state, data) => {
      state.user = data;
    },
    setAdminValidation: (state, data) => {
      state.adminValidation = data;
    },
    setAdmin: (state, data) => {
      state.isAdmin = data;
    },
    setErrorMsg: (state, data) => {
      state.errorMsg = data;
    },
    setSnapshot: (state, data) => {
      state.snapshot = data;
    },
    setType: (state, data) => {
      state.type = data;
    }
  },
  actions: {
    getUser: async context => {
      const user = auth.currentUser;
      if (!user) {
        return;
      }
      const mydb = db.collection("users").doc(user.uid);
      var raid = await mydb.get();
      if (!raid.exists) {
        db.collection("users")
          .doc(user.uid)
          .onSnapshot(snapshot => {
            defaultSetup(user, context);
            context.commit("setUser", snapshot.data());
            router.push("/home");
          });
      } else {
        defaultSetup(user, context);
        context.commit("setUser", raid.data());
      }
    },
    logOut: async context => {
      await auth.signOut();
      context.commit("setUser", null);
      context.commit("setAdminValidation", false);
    },
    validateAdmin: async (context, email) => {
      const usersRef = db.collection("invites");
      const snapshot = await usersRef.where("inviteeEmail", "==", email).get();
      if (!snapshot.empty) {
        context.commit("setAdminValidation", true);
      } else {
        context.commit("setAdminValidation", false);
      }
    },
    getSnapshot: async (context, [col, field, variable]) => {
      const snap = await db
        .collection(col)
        .where(field, "==", variable)
        .get();
      context.commit("setSnapshot", snap);
    }
  }
});
