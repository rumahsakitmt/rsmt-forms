export type ChoiceOption = {
  value: string;
  label: string;
};

export type VisibilityRule = {
  fieldId: string;
  operator: "equals" | "includes";
  value: string;
};

type BaseField = {
  id: string;
  number?: string;
  label: string;
  description?: string;
  required?: boolean;
  visibleWhen?: VisibilityRule | VisibilityRule[];
};

export type TextField = BaseField & {
  type: "text" | "textarea";
  placeholder?: string;
};

export type SingleChoiceField = BaseField & {
  type: "singleChoice";
  options: ChoiceOption[];
};

export type MultiChoiceField = BaseField & {
  type: "multiChoice";
  options: ChoiceOption[];
  minSelections?: number;
  exclusiveValues?: string[];
};

export type MatrixSingleField = BaseField & {
  type: "matrixSingle";
  rows: ChoiceOption[];
  columns: ChoiceOption[];
  minSelections?: number;
  rowsFromField?: string;
};

export type FormField =
  | TextField
  | SingleChoiceField
  | MultiChoiceField
  | MatrixSingleField;

export type FormSection = {
  id: string;
  eyebrow?: string;
  title: string;
  description?: string;
  fields: FormField[];
};

export type FormSchema = {
  schemaVersion: 1;
  layout?: "sectioned" | "continuous";
  title: string;
  shortTitle: string;
  description: string;
  sections: FormSection[];
};

export type AnswerValue = string | string[] | Record<string, string> | null;
export type FormAnswers = Record<string, AnswerValue>;

export type PatientContext = {
  patientName: string;
  medicalRecordNumber: string;
  room: string;
};

export type SubmissionMode = "draft" | "submit";

export type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};
