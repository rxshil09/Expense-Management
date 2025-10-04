// Placeholder form components
export const FormInput = ({ ...props }: any) => {
  return <input {...props} />;
};

export const FormSelect = ({ children, ...props }: any) => {
  return <select {...props}>{children}</select>;
};

export const FormTextarea = ({ ...props }: any) => {
  return <textarea {...props} />;
};