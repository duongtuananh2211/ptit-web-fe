import * as yup from "yup";

const dateRangeRule = (
  value: string | undefined,
  context: yup.TestContext,
): boolean => {
  const startDate = context.parent.startDate as string;

  if (!value || !startDate) {
    return true;
  }

  return new Date(value) >= new Date(startDate);
};

export const createProjectSchema = yup.object({
  projectKey: yup
    .string()
    .trim()
    .min(2, "Project key must be at least 2 characters")
    .max(20, "Project key must not exceed 20 characters")
    .matches(
      /^[A-Za-z0-9_-]+$/,
      "Project key can only contain letters, numbers, underscores, and hyphens",
    )
    .required("Project key is required"),
  projectName: yup
    .string()
    .trim()
    .min(3, "Project name must be at least 3 characters")
    .max(120, "Project name must not exceed 120 characters")
    .required("Project name is required"),
  description: yup
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters"),
  startDate: yup.string().trim(),
  endDate: yup
    .string()
    .trim()
    .test(
      "end-after-start",
      "End date must be on or after start date",
      dateRangeRule,
    ),
});

export const updateProjectSchema = yup.object({
  projectName: yup
    .string()
    .trim()
    .min(3, "Project name must be at least 3 characters")
    .max(120, "Project name must not exceed 120 characters")
    .required("Project name is required"),
  description: yup
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters"),
  status: yup
    .string()
    .oneOf(["Draft", "Active", "OnHold", "Archived"], "Invalid status")
    .required("Status is required"),
  startDate: yup.string().trim(),
  endDate: yup
    .string()
    .trim()
    .test(
      "end-after-start",
      "End date must be on or after start date",
      dateRangeRule,
    ),
});

export const addProjectMemberSchema = yup.object({
  userId: yup.string().trim().required("Please select a user from suggestions"),
  projectRole: yup
    .string()
    .trim()
    .min(2, "Project role must be at least 2 characters")
    .max(30, "Project role must not exceed 30 characters")
    .required("Project role is required"),
});

