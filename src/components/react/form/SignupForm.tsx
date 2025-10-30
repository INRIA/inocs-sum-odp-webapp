import React, { useState } from "react";
import { Input } from "../../react-catalyst-ui-kit/typescript/input";
import {
  Radio,
  RadioField,
  RadioGroup,
} from "../../react-catalyst-ui-kit/typescript/radio";
import { Label } from "../../react-catalyst-ui-kit/typescript/fieldset";
import { Select } from "../../react-catalyst-ui-kit/typescript/select";
import { RButton } from "../ui/RButton";
import { getUrl } from "../../../lib/helpers";
import ApiClient from "../../../lib/api-client/ApiClient";
import { signIn } from "auth-astro/client";
import { InfoAlert } from "../ui";
const api = new ApiClient();

type Mode = "create" | "join";

interface Props {
  livingLabs?: { id: string; name: string }[];
}

export default function SignupForm({ livingLabs }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [livingLab, setLivingLab] = useState("");
  const [mode, setMode] = useState<Mode>("join");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setIsLoading(true);
    try {
      const newUser = await api.signupLabEditor({
        name,
        email,
        password,
        living_lab_id: livingLab,
      });
      if (newUser && newUser.id && newUser.status === "active") {
        setProgress("Signup successful! Signing you in...");
        const signinResult = await signIn("credentials", {
          email: email.trim().toLowerCase(),
          password,
          redirect: false,
          redirectTo: "/lab-admin",
        });

        if (signinResult) {
          setError("Unable to sign in.");
        }
      } else if (newUser && newUser.id) {
        setProgress(
          "Signup successful! Your account is pending activation by an administrator."
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

      <div className="text-sm">
        <RadioGroup
          name="labMode"
          value={mode}
          onChange={(v: any) => setMode(v)}
          aria-label="Living lab mode"
          disabled={isLoading}
        >
          {/* <RadioField>
            <Radio value="create" />
            <Label>Create new Living Lab</Label>
          </RadioField> */}

          <RadioField>
            <Radio value="join" />
            <Label>Manage existing Living Lab</Label>
          </RadioField>
        </RadioGroup>
      </div>

      {mode === "join" && (
        <div>
          <label>Living Lab</label>
          <Select
            value={livingLab}
            onChange={(e: any) => setLivingLab(e.target.value)}
            disabled={isLoading}
          >
            <option value="">Select a Living Lab</option>
            {livingLabs?.map((lab) => (
              <option key={lab.id} value={lab.id}>
                {lab.name}
              </option>
            ))}
          </Select>
        </div>
      )}

      <div className="flex gap-6">
        <RButton
          type="submit"
          variant="primary"
          text={isLoading ? "In progress..." : "Sign up"}
          disabled={isLoading}
          onClick={handleSubmit}
        />

        <RButton
          type="button"
          variant="secondary"
          text="Cancel"
          onClick={() => {
            setName("");
            setEmail("");
            setPassword("");
            setLivingLab("");
            setMode("join");
          }}
        />
      </div>

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
