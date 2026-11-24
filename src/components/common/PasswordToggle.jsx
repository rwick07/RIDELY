// src/components/common/PasswordToggle.jsx
import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export const PasswordToggle = ({ id, value, onChange, placeholder }) => {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="block w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600"
        required
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
};
