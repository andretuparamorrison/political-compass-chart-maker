import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { EditableImage } from './editable-image.model';
import { Subscription } from 'rxjs';
import { getImageStyle } from './editable-image.helper';

@Component({
  selector: 'app-editable-image',
  templateUrl: './editable-image.component.html',
  styleUrls: ['./editable-image.component.scss']
})
export class EditableImageComponent {
  @Input()
  imageFormGroup!: FormGroup<{
    scrollX: FormControl<number>;
    scrollY: FormControl<number>;
    src: FormControl<string>;
    zoom: FormControl<number>;
  }>;

  get imageStyle() {
    const formValue = this.imageFormGroup.getRawValue();
    return getImageStyle(formValue, 100);
  }

  constructor() { }

  add() {
    const src = prompt("Please specify an image URL: ");
    if (!src) {
      return;
    }
    this.imageFormGroup.enable();
    this.imageFormGroup.setValue({
      scrollX: 0,
      scrollY: 0,
      src: src,
      zoom: 10
    });
  }

  clear() {
    this.imageFormGroup.disable();
  }
}
