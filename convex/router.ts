import * as auth from "./auth";
import * as files from "./files";
import * as poems from "./poems";
import * as users from "./users";
import * as payments from "./payments";
import http from "./http";

// Combine and export all route modules
export default {
  ...auth,
  ...files,
  ...poems,
  ...users,
  ...payments,
  http
};
