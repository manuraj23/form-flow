import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FieldQuizConfig } from './field-quiz-config';

describe('FieldQuizConfig', () => {
  let component: FieldQuizConfig;
  let fixture: ComponentFixture<FieldQuizConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FieldQuizConfig]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FieldQuizConfig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
