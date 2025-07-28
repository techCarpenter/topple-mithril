/** @import * as types from "../types.js" */
import { db } from "../db.js";

const UserService = {
  /**
   * Get all users from database
   * @returns {Promise<types.User[]>} List of all users
   */
  getUsers: async () => {
    let query = db.prepare("SELECT id, name, username, email FROM users");
    return /** @type {types.User[]} */ (query.all());
  },
  // getUserById
  // addUser
  // updateUser
  // deleteUser
}

export { UserService }