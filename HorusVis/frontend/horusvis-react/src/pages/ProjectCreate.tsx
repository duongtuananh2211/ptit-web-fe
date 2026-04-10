import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ValidationError } from "yup";
import {
  projectsService,
  type CreateProjectRequest,
} from "../services/projectsService";
import { createProjectSchema } from "../validation/projectSchema";
import { FormTextArea, TextInput } from "../components/FormFields";

const INITIAL_FORM: CreateProjectRequest = {
  projectKey: "",
  projectName: "",
  description: "",
  startDate: "",
  endDate: "",
};

type FormErrors = Partial<Record<keyof CreateProjectRequest, string>>;

const ProjectCreate = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateProjectRequest>(INITIAL_FORM);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const updateField = <K extends keyof CreateProjectRequest>(
    key: K,
    value: CreateProjectRequest[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const mapValidationErrors = (
    validationError: ValidationError,
  ): FormErrors => {
    const nextErrors: FormErrors = {};

    validationError.inner.forEach((entry) => {
      if (!entry.path) {
        return;
      }

      const field = entry.path as keyof CreateProjectRequest;
      if (!nextErrors[field]) {
        nextErrors[field] = entry.message;
      }
    });

    return nextErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    try {
      await createProjectSchema.validate(form, { abortEarly: false });
    } catch (err) {
      if (err instanceof ValidationError) {
        setFieldErrors(mapValidationErrors(err));
        return;
      }

      setError("Invalid project form data.");
      return;
    }

    setSubmitting(true);

    try {
      const created = await projectsService.createProject(form);
      navigate(`/projects/${created.id}`, {
        replace: true,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create project.",
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
            Create Project
          </h2>
          <p className="text-on-surface-variant mt-1">
            Create a new project using the Projects API.
          </p>
        </div>
        <Link
          to="/projects"
          className="px-4 py-2 bg-surface-container-high text-on-surface rounded-xl font-bold border border-outline/20 hover:bg-surface-container-highest transition-colors inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Back to Projects
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

      <form
        onSubmit={handleSubmit}
        noValidate
        className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-surface-container-lowest rounded-2xl border border-slate-100/50 shadow-sm p-5"
      >
        <TextInput
          value={form.projectKey}
          onChange={(event) => updateField("projectKey", event.target.value)}
          placeholder="Project key (e.g. HORUS)"
          error={fieldErrors.projectKey}
        />

        <TextInput
          value={form.projectName}
          onChange={(event) => updateField("projectName", event.target.value)}
          placeholder="Project name"
          error={fieldErrors.projectName}
        />

        <FormTextArea
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
          placeholder="Description"
          error={fieldErrors.description}
          containerClassName="md:col-span-2"
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
            {submitting ? "Creating..." : "Create Project"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/projects")}
            className="px-5 py-3 bg-surface-container-high text-on-surface rounded-xl font-bold border border-outline/20 hover:bg-surface-container-highest transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectCreate;

