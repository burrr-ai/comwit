import { action } from "@comwit/state";
import type { User, UserActions } from "../types";
import { user } from "../model";

type UserAuthActions = Pick<
  UserActions,
  "signIn" | "signUp" | "signOut"
>;

export const userAuthActions = action<UserAuthActions>(({ state }) => {
  class UserAuthActions {
    private model = state(user);

    /**
     * Sign in with username and password
     * TODO: Replace with actual API call
     * TODO: Connect with auth API client and persist session token
     */
    async signIn({
      username,
      password,
    }: {
      username: string;
      password: string;
    }): Promise<void> {
      this.model.isLoading = true;

      try {
        // TODO: const { error, user } = await authClient.signIn({ username, password })
        const nextUser: User = {
          id: "1",
          email: `${username}@example.com`,
          name: "Mock User",
          username,
          displayUsername: username,
          image: null,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.model.me.set(nextUser);
      } finally {
        this.model.isLoading = false;
      }
    }

    /**
     * Sign up with email, username, name, and password
     * TODO: Replace with actual API call
     * TODO: Fetch user profile immediately after signup
     */
    async signUp({
      email,
      username,
      name,
      password,
    }: {
      email: string;
      username: string;
      name: string;
      password: string;
    }): Promise<void> {
      this.model.isLoading = true;

      try {
        // TODO: const { error, user } = await authClient.signUp({ email, username, name, password })
        const nextUser: User = {
          id: "1",
          email,
          name,
          username,
          displayUsername: username,
          image: null,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.model.me.set(nextUser);
      } finally {
        this.model.isLoading = false;
      }
    }

    /**
     * Sign out current user
     * TODO: Replace with actual API call
     */
    async signOut(): Promise<void> {
      this.model.isLoading = true;

      try {
        // TODO: await authClient.signOut()
        this.model.me.set(null);
      } finally {
        this.model.isLoading = false;
      }
    }
  }

  return new UserAuthActions();
});
