// src/components/AuthForm.jsx
import React, { useState } from "react";
import { PasswordToggle } from "./common/PasswordToggle";

export const AuthForm = ({ title, fields, onSubmit, submitLabel, footer }) => {
  const initialState = fields.reduce((obj, f) => ({ ...obj, [f.name]: "" }), {});
  const [values, setValues] = useState(initialState);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    for (const f of fields) {
      if (f.required && !values[f.name]) {
        return `${f.label} is required`;
      }
      if (f.validate) {
        const err = f.validate(values[f.name], values);
        if (err) return err;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    try {
      setSubmitting(true);
      await onSubmit(values);
      setSuccess("Success!");
    } catch (e) {
      setError(e.message || "Error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-gray-100">{title}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((f) => (
          <div key={f.name} className="relative">
            <label htmlFor={f.name} className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-200">
              {f.label}
            </label>
            {f.type === "password" ? (
              <PasswordToggle
                id={f.name}
                value={values[f.name]}
                onChange={handleChange}
                placeholder={f.placeholder}
              />
            ) : (
              <input
                id={f.name}
                name={f.name}
                type={f.type}
                placeholder={f.placeholder}
                value={values[f.name]}
                onChange={handleChange}
                required={f.required}
                className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
              />
            )}
          </div>
        ))}
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        {success && <p className="text-green-600 text-sm text-center">{success}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 px-4 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? "Processing…" : submitLabel}
        </button>
      </form>
      {footer && <div className="mt-4 text-center">{footer}</div>}
    </div>
  );
};
