import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConditionalLogic } from './conditional-logic';

describe('ConditionalLogic', () => {
  let component: ConditionalLogic;
  let fixture: ComponentFixture<ConditionalLogic>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConditionalLogic]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConditionalLogic);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
