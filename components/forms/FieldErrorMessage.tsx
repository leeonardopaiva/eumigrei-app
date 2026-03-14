import React from 'react';

const FieldErrorMessage: React.FC<{ message?: string | null }> = ({ message }) => {
  if (!message) {
    return null;
  }

  return <p className="px-2 text-xs font-medium text-red-600">{message}</p>;
};

export default FieldErrorMessage;
