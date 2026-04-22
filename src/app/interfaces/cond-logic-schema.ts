export interface CondLogicSchema {
    enabled: boolean;
    sourceFieldId: string;
    operator: 'EQUALS' | 'NOT_EQUALS';
    value: any;
    action: 'SHOW' | 'HIDE';
}
