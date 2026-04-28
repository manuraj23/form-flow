import { inject } from '@angular/core';
export interface FormSettingsSchema {
    deadline?: string | Date;
    isPrivate?: boolean;
    editWindowMinutes: number;
    maxResponses?: number;
    closeMessage?: string;
    isQuizMode?: boolean;
    showScore?: boolean;
    defaultPointsPerField?: number;
    duration ?: number;
}
