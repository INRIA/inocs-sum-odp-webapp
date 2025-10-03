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

type Mode = "create" | "join";

export default function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [livingLab, setLivingLab] = useState("");
  const [mode, setMode] = useState<Mode>("create");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    window.location.href = getUrl("/lab-admin/edit");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label>Name</label>
        <Input
          value={name}
          onChange={(e: any) => setName(e.target.value)}
          placeholder="Your full name"
          required
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
        />
      </div>

      <div className="text-sm">
        <RadioGroup
          name="labMode"
          value={mode}
          onChange={(v: any) => setMode(v)}
          aria-label="Living lab mode"
        >
          <RadioField>
            <Radio value="create" />
            <Label>Create new Living Lab</Label>
          </RadioField>

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
          >
            <option value="">Select a Living Lab</option>
            <option value="geneva">Geneva</option>
            <option value="lyon">Lyon</option>
            <option value="barcelona">Barcelona</option>
          </Select>
        </div>
      )}

      <div className="flex gap-6">
        <RButton type="submit" variant="primary" text="Signup" />

        <RButton
          type="button"
          variant="secondary"
          text="Cancel"
          onClick={() => {
            setName("");
            setEmail("");
            setPassword("");
            setLivingLab("");
            setMode("create");
          }}
        />
      </div>

      <div className="text-center mt-6">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href={getUrl("/lab-admin/login")}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Sign in to your account
          </a>
        </p>
      </div>
    </form>
  );
}
