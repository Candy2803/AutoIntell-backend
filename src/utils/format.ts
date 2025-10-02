export const formatValidationError = (errors: any): string => {
  if (!errors || !errors.issues) return 'Validation Failed';

  if (Array.isArray(errors.issues))
    return errors.issues.map((i: any) => i.message).join(', ');

  return JSON.stringify(errors);
};
