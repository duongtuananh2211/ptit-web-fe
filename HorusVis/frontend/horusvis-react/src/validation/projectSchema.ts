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

export const createTaskSchema = yup.object({
  title: yup
    .string()
    .trim()
    .min(3, "Task title must be at least 3 characters")
    .max(200, "Task title must not exceed 200 characters")
    .required("Task title is required"),
  description: yup
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters"),
  priority: yup
    .string()
    .oneOf(["Low", "Medium", "High", "Critical"], "Invalid priority")
    .required("Priority is required"),
  featureAreaId: yup.string().trim(),
  planEstimate: yup
    .string()
    .trim()
    .test(
      "valid-plan-estimate",
      "Plan estimate must be a positive number",
      (value) => {
        if (!value) {
          return true;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0;
      },
    ),
  startDate: yup.string().trim(),
  dueDate: yup
    .string()
    .trim()
    .test(
      "due-after-start",
      "Due date must be on or after start date",
      function (value) {
        const startDate = this.parent.startDate as string;

        if (!value || !startDate) {
          return true;
        }

        return new Date(value) >= new Date(startDate);
      },
    ),
});

export const updateTaskSchema = yup.object({
  title: yup
    .string()
    .trim()
    .min(3, "Task title must be at least 3 characters")
    .max(200, "Task title must not exceed 200 characters")
    .required("Task title is required"),
  description: yup
    .string()
    .trim()
    .max(2000, "Description must not exceed 2000 characters"),
  status: yup
    .string()
    .oneOf(["ToDo", "Working", "Stuck", "Done"], "Invalid status")
    .required("Status is required"),
  priority: yup
    .string()
    .oneOf(["Low", "Medium", "High", "Critical"], "Invalid priority")
    .required("Priority is required"),
  assigneeUserId: yup.string().trim().required("Assignee is required"),
  blockedNote: yup
    .string()
    .trim()
    .max(2000, "Blocked note must not exceed 2000 characters"),
  featureAreaId: yup.string().trim(),
  planEstimate: yup
    .string()
    .trim()
    .test(
      "valid-plan-estimate",
      "Plan estimate must be a positive number",
      (value) => {
        if (!value) {
          return true;
        }

        const parsed = Number(value);
        return Number.isFinite(parsed) && parsed > 0;
      },
    ),
  startDate: yup.string().trim(),
  dueDate: yup
    .string()
    .trim()
    .test(
      "due-after-start",
      "Due date must be on or after start date",
      function (value) {
        const startDate = this.parent.startDate as string;

        if (!value || !startDate) {
          return true;
        }

        return new Date(value) >= new Date(startDate);
      },
    ),
});

