"use client";

import { FormControl, TextInput } from "@primer/react";

export default function UsernameStep({ data, onChange, errors }) {
  const handleChange = (e) => {
    onChange({ username: e.target.value });
  };

  return (
    <div>
      <FormControl>
        <FormControl.Label>Username</FormControl.Label>
        <TextInput
          placeholder="Enter your username"
          value={data.username}
          onChange={handleChange}
          size="medium"
          block
          validation={errors.username ? "error" : undefined}
        />
        {errors.username && (
          <FormControl.Validation variant="error">
            {errors.username}
          </FormControl.Validation>
        )}
      </FormControl>
    </div>
  );
}
