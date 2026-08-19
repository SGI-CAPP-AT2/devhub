"use client";

import { FormControl, TextInput, Text } from "@primer/react";
import { useState } from "react";
import { EyeIcon, EyeClosedIcon } from "@primer/octicons-react";

export default function PasswordStep({ data, onChange, errors }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePasswordChange = (e) => {
    onChange({ password: e.target.value });
  };

  const handleConfirmChange = (e) => {
    onChange({ confirmPassword: e.target.value });
  };

  const passwordStrength = data.password
    ? getPasswordStrength(data.password)
    : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <FormControl>
        <FormControl.Label>Password</FormControl.Label>
        <TextInput
          placeholder="Enter a strong password"
          type={showPassword ? "text" : "password"}
          value={data.password}
          onChange={handlePasswordChange}
          size="medium"
          block
          trailingAction={
            <TextInput.Action
              onClick={() => setShowPassword(!showPassword)}
              icon={showPassword ? EyeClosedIcon : EyeIcon}
              aria-label="Toggle password visibility"
            />
          }
          validation={errors.password ? "error" : undefined}
        />
        {errors.password && (
          <FormControl.Validation variant="error">
            {errors.password}
          </FormControl.Validation>
        )}
      </FormControl>

      {data.password && passwordStrength && (
        <div
          style={{
            padding: "8px 12px",
            backgroundColor: "var(--bgColor-inset)",
            borderRadius: "6px",
          }}
        >
          <Text as="div" fontSize={0} style={{ marginBottom: "4px" }}>
            <strong>Password Strength:</strong>{" "}
            <span style={{ color: getStrengthColor(passwordStrength) }}>
              {passwordStrength.toUpperCase()}
            </span>
          </Text>
          <div
            style={{
              height: "4px",
              backgroundColor: getStrengthColor(passwordStrength),
              borderRadius: "2px",
            }}
          />
        </div>
      )}

      <FormControl>
        <FormControl.Label>Confirm Password</FormControl.Label>
        <TextInput
          placeholder="Confirm your password"
          type={showConfirm ? "text" : "password"}
          value={data.confirmPassword}
          onChange={handleConfirmChange}
          size="medium"
          block
          trailingAction={
            <TextInput.Action
              onClick={() => setShowConfirm(!showConfirm)}
              icon={showConfirm ? EyeClosedIcon : EyeIcon}
              aria-label="Toggle confirm password visibility"
            />
          }
          validation={errors.confirmPassword ? "error" : undefined}
        />
        {errors.confirmPassword && (
          <FormControl.Validation variant="error">
            {errors.confirmPassword}
          </FormControl.Validation>
        )}
      </FormControl>
    </div>
  );
}

function getPasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z\d]/.test(password)) strength++;

  if (strength <= 2) return "weak";
  if (strength <= 3) return "fair";
  if (strength <= 4) return "good";
  return "strong";
}

function getStrengthColor(strength) {
  switch (strength) {
    case "weak":
      return "var(--fgColor-danger)";
    case "fair":
      return "var(--fgColor-warning)";
    case "good":
      return "var(--fgColor-success)";
    case "strong":
      return "var(--fgColor-success)";
    default:
      return "var(--fgColor-muted)";
  }
}
