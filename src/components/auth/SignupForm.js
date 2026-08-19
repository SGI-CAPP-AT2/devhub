"use client";

import { useState } from "react";
import { Button, Text, FormControl } from "@primer/react";
import { ChevronRightIcon, ChevronLeftIcon } from "@primer/octicons-react";
import styles from "./SignupForm.module.css";
import UsernameStep from "./steps/UsernameStep";
import PasswordStep from "./steps/PasswordStep";
import GitHubStep from "./steps/GitHubStep";

const STEPS = [
  { id: "username", label: "Username", component: UsernameStep },
  { id: "password", label: "Password", component: PasswordStep },
  { id: "github", label: "Authorize GitHub", component: GitHubStep },
];

export function SignupForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    githubAuthorized: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleStepChange = (stepData) => {
    setFormData((prev) => ({ ...prev, ...stepData }));
  };

  const validateStep = async () => {
    const step = STEPS[currentStep];
    const newErrors = {};

    if (step.id === "username") {
      if (!formData.username || formData.username.length < 3) {
        newErrors.username = "Username must be at least 3 characters";
      }
      if (formData.username && !/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
        newErrors.username =
          "Username can only contain letters, numbers, underscores, and hyphens";
      }
    }

    if (step.id === "password") {
      if (!formData.password || formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    if (step.id === "github") {
      if (!formData.githubAuthorized) {
        newErrors.github = "GitHub authorization is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    const isValid = await validateStep();
    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else if (isValid && currentStep === STEPS.length - 1) {
      await handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Call signup API
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          githubAuthorized: formData.githubAuthorized,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        setErrors({ submit: error.message || "Signup failed" });
        return;
      }

      // Redirect to dashboard or login
      window.location.href = "/";
    } catch (err) {
      setErrors({ submit: err.message || "An error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep].component;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className={styles.signupFormContainer}>
      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar} style={{ width: `${progress}%` }} />
      </div>

      {/* Step Indicator */}
      <div className={styles.stepIndicator}>
        {STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`${styles.stepDot} ${
              index === currentStep ? styles.active : ""
            } ${index < currentStep ? styles.completed : ""}`}
            title={step.label}
          />
        ))}
      </div>

      {/* Step Title */}
      <h2 className={styles.stepTitle}>
        Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].label}
      </h2>

      {/* Step Content */}
      <div className={styles.stepContent}>
        <CurrentStepComponent
          data={formData}
          onChange={handleStepChange}
          errors={errors}
        />
      </div>

      {/* Navigation */}
      <div className={styles.navigation}>
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          variant="secondary"
          leadingVisual={ChevronLeftIcon}
        >
          Previous
        </Button>

        <Button
          onClick={handleNext}
          loading={loading}
          trailingVisual={ChevronRightIcon}
          variant="primary"
        >
          {currentStep === STEPS.length - 1 ? "Complete Signup" : "Next"}
        </Button>
      </div>

      {/* Submit Error */}
      {errors.submit && (
        <div className={styles.errorMessage}>{errors.submit}</div>
      )}
    </div>
  );
}

export default SignupForm;
