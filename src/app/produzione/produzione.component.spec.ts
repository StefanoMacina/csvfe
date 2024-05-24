import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProduzioneComponent } from './produzione.component';

describe('ProduzioneComponent', () => {
  let component: ProduzioneComponent;
  let fixture: ComponentFixture<ProduzioneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProduzioneComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ProduzioneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
