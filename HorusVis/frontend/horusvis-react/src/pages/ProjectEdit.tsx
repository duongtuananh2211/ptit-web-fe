import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ValidationError } from "yup";
import {
  projectsService,
  type UpdateProjectRequest,
} from "../services/projectsService";
import { updateProjectSchema } from "../validation/projectSchema";
import { FormSelect, FormTextArea, TextInput } from "../components/FormFields";

const STATUS_OPTIONS = ["Draft", "Active", "OnHold", "Archived"];
const STATUS_SELECT_OPTIONS = STATUS_OPTIONS.map((status) => ({
  label: status,
  value: status,
}));

const toDateInput = (value: string): string => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
};

const ProjectEdit = () => {
  const navigate = useNavigate();
  const { projectId = "" } = useParams();

  const [form, setForm] = useState<UpdateProjectRequest>({
    projectName: "",
    description: "",
    status: "Active",
    startDate: "",
    endDate: "",
  });

  const [loading, setLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof UpdateProjectRequest, string>>
  >({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = <K extends keyof UpdateProjectRequest>(
    key: K,
    value: UpdateProjectRequest[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const mapValidationErrors = (
    validationError: ValidationError,
  ): Partial<Record<keyof UpdateProjectRequest, string>> => {
    const nextErrors: Partial<Record<keyof UpdateProjectRequest, string>> = {};

    validationError.inner.forEach((entry) => {
      if (!entry.path) {
        return;
      }

      const field = entry.path as keyof UpdateProjectRequest;
      if (!nextErrors[field]) {
        nextErrors[field] = entry.message;
      }
    });

    return nextErrors;
  };

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        setError("Invalid project id.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const project = await projectsService.getProjectById(projectId);

        setForm({
          projectName: project.title,
          description: project.description,
          status: project.status || "Active",
          startDate: toDateInput(project.startDate),
          endDate: toDateInput(project.endDate),
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load project.",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProject();
  }, [projectId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!projectId) {
      setError("Invalid project id.");
      return;
    }

    setFieldErrors({});
    try {
      await updateProjectSchema.validate(form, { abortEarly: false });
    } catch (err) {
      if (err instanceof ValidationError) {
        setFieldErrors(mapValidationErrors(err));
        return;
      }

      setError("Invalid project form data.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await projectsService.updateProject(projectId, form);
      navigate(`/projects/${projectId}`, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update project.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">
            Projects
          </p>
          <h2 className="text-3xl font-black text-on-surface editorial-tight mt-2">
            Edit Project
          </h2>
          <p className="text-on-surface-variant mt-1">
            Update project information using the Projects API.
          </p>
        </div>
        <Link
          to={projectId ? `/projects/${projectId}` : "/projects"}
          className="px-4 py-2 bg-surface-container-high text-on-surface rounded-xl font-bold border border-outline/20 hover:bg-surface-container-highest transition-colors inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back
        </Link>
      </div>

      {error && (
        <div className="rounded-xl bg-error-container p-4 text-sm text-error">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl bg-surface-container-low p-6 text-on-surface-variant">
          Loading project data...
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container-lowest rounded-2xl border border-slate-100/50 shadow-sm p-5"
        >
          <TextInput
            value={form.projectName}
            onChange={(event) => updateField("projectName", event.target.value)}
            placeholder="Project name"
            error={fieldErrors.projectName}
            containerClassName="md:col-span-2"
          />

          <FormTextArea
            value={form.description}
            onChange={(event) => updateField("description", event.target.value)}
            placeholder="Description"
            error={fieldErrors.description}
            containerClassName="md:col-span-2"
          />

          <FormSelect
            label="Status"
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
            options={STATUS_SELECT_OPTIONS}
            error={fieldErrors.status}
          />

          <TextInput
            type="date"
            label="Start date"
            value={form.startDate}
            onChange={(event) => updateField("startDate", event.target.value)}
            error={fieldErrors.startDate}
          />

          <TextInput
            type="date"
            label="End date"
            value={form.endDate}
            onChange={(event) => updateField("endDate", event.target.value)}
            error={fieldErrors.endDate}
          />

          <div className="md:col-span-2 flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-3 primary-gradient text-on-primary rounded-xl font-bold shadow-lg hover:scale-102 active:scale-98 transition-all disabled:opacity-60"
            >
              {submitting ? "Updating..." : "Update Project"}
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(projectId ? `/projects/${projectId}` : "/projects")
              }
              className="px-5 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold border border-outline/20 hover:bg-surface-container-highest transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProjectEdit;

