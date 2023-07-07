import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditableImageComponent } from './editable-image.component';

describe('EditableImageComponent', () => {
  let component: EditableImageComponent;
  let fixture: ComponentFixture<EditableImageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EditableImageComponent]
    });
    fixture = TestBed.createComponent(EditableImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
