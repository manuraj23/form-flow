import { FieldQuizConfig } from "../components/field-quiz-config/field-quiz-config";
import { FieldType } from "../enums/field-type.enum";
import { CondLogicSchema } from "./cond-logic-schema";
import { Quizconfigschema } from "./quizconfigschema";

interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  email?: boolean;
  number?: boolean;
  max?: number;
  maxSize?: number;
  fileType?: string;

}

export interface BuilderFieldSchema {
  type?: FieldType,
  placeholder?: string,
  validations?: ValidationRules,
  fieldLogic?: CondLogicSchema,
  options?: string[] ,
  quizConfig?: Quizconfigschema
}