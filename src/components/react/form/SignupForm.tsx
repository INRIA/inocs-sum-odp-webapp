import React, { useState } from "react";
import { Input } from "../../react-catalyst-ui-kit/typescript/input";
import { RButton } from "../ui/RButton";
import { getUrl } from "../../../lib/helpers";
import ApiClient from "../../../lib/api-client/ApiClient";
import { signIn } from "auth-astro/client";
import { InfoAlert } from "../ui";
import {
  LivingLabModeOptions,
  type LivingLabMode,
} from "./LivingLabModeOptions";
const api = new ApiClient();

type Mode = "create" | "select";

interface Props {
  livingLabs?: { id: string; name: string }[];
}

export default function SignupForm({ livingLabs }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [livingLab, setLivingLab] = useState("");
  const [mode, setMode] = useState<Mode>("select");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  const validateForm = () => {
    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return false;
    }
    const emailTrim = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrim)) {
      setError("Please enter a valid email address.");
      return false;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }
    if (mode === "select" && !livingLab) {
      setError("Please select a Living Lab.");
      return false;
    }
    return true;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setProgress("");

    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      const living_lab_id = mode === "select" ? livingLab : undefined;
      const newUser = await api.signupLabEditor({
        name,
        email,
        password,
        living_lab_id,
      });
      if (newUser && newUser.id && newUser.status === "active") {
        setProgress("Signup successful! Signing you in...");
        const signinResult = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: living_lab_id ? false : true,
          callbackUrl: living_lab_id ? "/lab-admin" : "/lab-admin/lab/new",
        });

        if (signinResult) {
          setError("Unable to sign in.");
        }
      } else if (newUser && newUser.id) {
        setProgress(
          "Signup successful! Your account is pending activation by an administrator.",
        );
        window.location.href = getUrl("/pending-validation");
      } else {
        // Handle signup failure (e.g., show error message)
        setError("Signup failed. Please try again.");
      }
    } catch (error) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {progress && (
        <InfoAlert variant="success" title="Success">
          {progress}
        </InfoAlert>
      )}
      {error && (
        <InfoAlert variant="danger" title="Error">
          {error}
        </InfoAlert>
      )}
      <div>
        <label>Name</label>
        <Input
          value={name}
          onChange={(e: any) => setName(e.target.value)}
          placeholder="Your full name"
          required
          disabled={isLoading}
        />
      </div>

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
          placeholder="Choose a secure password"
          required
          disabled={isLoading}
        />
      </div>

      <LivingLabModeOptions
        livingLabs={livingLabs || []}
        mode={mode}
        onModeChange={(newMode: LivingLabMode) => setMode(newMode)}
        selectedLabId={livingLab}
        onLabSelect={setLivingLab}
        isLoading={isLoading}
        labels={{
          select: "Manage existing Living Lab",
          create: "Create new Living Lab",
          selectDropdown: "Living Lab",
        }}
      />

      <div className="flex gap-6">
        <RButton
          type="submit"
          variant="primary"
          text={isLoading ? "In progress..." : "Sign up"}
          disabled={isLoading}
          onClick={handleSubmit}
        />

        <RButton variant="secondary" text="Go back" href={getUrl("/")} />
      </div>

      <p className="text-xs text-gray-500">
        By signing up you agree to our{" "}
        <a
          href={getUrl("/privacy-policy")}
          className="text-blue-800 hover:text-blue-800 underline"
        >
          Privacy Policy
        </a>
        .
      </p>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          Already have an account?<br></br>
          <a
            href={getUrl("/lab-admin/login")}
            className="text-blue-800 hover:text-blue-800 underline"
          >
            Sign in to your account
          </a>
        </p>
      </div>
    </form>
  );
}
