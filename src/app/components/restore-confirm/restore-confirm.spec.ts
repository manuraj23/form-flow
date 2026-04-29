import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RestoreConfirm } from './restore-confirm';

describe('RestoreConfirm', () => {
  let component: RestoreConfirm;
  let fixture: ComponentFixture<RestoreConfirm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RestoreConfirm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RestoreConfirm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
