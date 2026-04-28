import { CondLogicSchema } from "./cond-logic-schema";
import { FieldStyleSchema } from "./field-style-schema";
import { FormSettingsSchema } from "./form-settings-schema";
import { Quizconfigschema } from "./quizconfigschema";

export interface Field {
  id?:string;
  fieldType: string;
  fieldOrder: number;
  fieldConfig: {};
  fieldStyle: FieldStyleSchema;
  fieldLogic?: CondLogicSchema;
  quizConfig?: Quizconfigschema;
}

export interface Section {
  id?:string;
  sectionTitle: string;
  sectionOrder: number;
  fields: Field[];
}

export interface Form {
  id?: string;
  userId?:number;
  createdBy?: string;
  theme:string;
  title: string;
  description: string;
  published: boolean;
  mainParentId?: string;
  settings?: FormSettingsSchema;
  sections: Section[];
  totalResponses?: number;
}