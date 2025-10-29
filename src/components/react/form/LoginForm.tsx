import React, { useState } from "react";
import { Input } from "../../react-catalyst-ui-kit/typescript/input";
import { RButton } from "../ui/RButton";
import { getUrl } from "../../../lib/helpers";
import { signIn } from "auth-astro/client";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false, // handle manually
        redirectTo: "/lab-admin", // where to go on success if redirect: true
      });

      if (result) {
        setError("Unable to sign in.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <div>
        <label>Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e: any) => setEmail(e.target.value)}
          placeholder="you@organization.org"
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label>Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e: any) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
          disabled={isLoading}
        />
      </div>

      <div className="flex gap-6">
        <RButton
          type="submit"
          variant="primary"
          text={isLoading ? "Signing in..." : "Sign in"}
          disabled={isLoading}
        />

        <RButton
          type="button"
          variant="secondary"
          text="Cancel"
          disabled={isLoading}
          onClick={() => {
            setEmail("");
            setPassword("");
            setError("");
          }}
        />
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          Don't have an account?
          <a
            // href={getUrl("/lab-admin/signup")}
            href={"#"}
            className="text-blue-800 hover:text-blue-800 underline"
          >
            Create a new account (coming soon)
          </a>
        </p>
      </div>
    </form>
  );
}

export { LoginForm };
