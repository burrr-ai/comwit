"use client";

export * from "./types";

import { create } from "@comwit/state";
import type { UserActions, UserState } from "./types";
import { user } from "./model";
import { userAuthActions } from "./actions/auth";

export const useUser = create<UserState, UserActions>(user, {
  actions: [userAuthActions],
});
