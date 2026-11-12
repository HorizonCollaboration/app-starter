/*
 * The app's own tables. Each person is a row in `user` (from the sign-in
 * tables): refer to it with `.references(() => user.id, { onDelete: "cascade" })`.
 * Only ever add tables and columns; never rename or remove one, so a new
 * version never loses what people have entered.
 */
import { user } from "./auth-schema";

export { user };
