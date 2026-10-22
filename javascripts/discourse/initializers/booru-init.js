import { apiInitializer } from "discourse/lib/api";
import booruState from "../lib/booru-state";

export default apiInitializer((api) => {
  booruState.init(api.getCurrentUser());
});
