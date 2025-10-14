import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderPropio } from './headerPropio';

describe('AdminHeader', () => {
  let component: HeaderPropio;
  let fixture: ComponentFixture<HeaderPropio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderPropio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderPropio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
