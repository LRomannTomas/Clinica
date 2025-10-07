import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuickLogin } from './quick-login';

describe('QuickLogin', () => {
  let component: QuickLogin;
  let fixture: ComponentFixture<QuickLogin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuickLogin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuickLogin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
