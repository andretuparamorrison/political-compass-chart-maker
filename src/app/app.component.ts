import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { EditableImage } from './editable-image/editable-image.model';
import { getImageStyle } from './editable-image/editable-image.helper';

const LOCAL_STORAGE_KEY = "political-compass-chart-points";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  @ViewChild("chart", { static: true }) chartElement!: ElementRef<HTMLElement>;

  mouseX = 0;
  mouseY = 0;

  editForm = this.fb.nonNullable.group({
    name: "",
    image: this.fb.nonNullable.group({
      scrollX: 0,
      scrollY: 0,
      src: "",
      zoom: 1
    }),
  });
  get editFormImageGroup() {
    return this.editForm.get('image') as FormGroup<{
      scrollX: FormControl<number>;
      scrollY: FormControl<number>;
      src: FormControl<string>;
      zoom: FormControl<number>;
    }>;
  }

  editPoint: boolean = false;
  movePoint: boolean = false;
  newPoint: boolean = false;
  showPointNames: boolean = false;

  newPointPositionStyle: PointStyle = {
    left: "0",
    top: "0",
    visibility: "hidden",
  };

  points: Point[] = [];
  selectedPoint?: Point;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    const storedPoints = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedPoints != null) {
      this.points = JSON.parse(storedPoints);
    }
  }

  @HostListener("document:mousemove", ["$event"])
  onMouseMove(event: MouseEvent) {
    this.mouseX = event.pageX;
    this.mouseY = event.pageY;
    this.updatePointerPosition();
  }

  getImageStyle(image: EditableImage | null, containerWidth: number) {
    if (image === null) {
      return {};
    }
    return getImageStyle(image, containerWidth);
  }

  pointClick(index: number) {
    if (this.newPoint) {
      return;
    }
    this.selectedPoint = this.points[index];
  }

  deletePoint(index: number) {
    this.points.splice(index, 1);
    this.updateLocalStorage();
  }

  deleteSelectedPoint() {
    if (!this.selectedPoint) {
      return;
    }
    const selectedPointIndex = this.points.indexOf(this.selectedPoint);
    this.deletePoint(selectedPointIndex);
    this.selectedPoint = undefined;
  }

  editSelectedPoint() {
    if (!this.selectedPoint) {
      return;
    }
    this.editPoint = true;
    this.editForm.patchValue({
      name: this.selectedPoint.name
    });
    const imageFormGroup = this.editForm.get('image')!;
    if (this.selectedPoint.image) {
      imageFormGroup.enable();
      this.editForm.patchValue({
        image: this.selectedPoint.image
      });
    }
    else {
      imageFormGroup.disable();
    }
    this.updateLocalStorage();
  }

  cancelEdit() {
    this.editPoint = false;
  }

  saveEdit() {
    this.editPoint = false;
    if (!this.selectedPoint) {
      return;
    }
    const formValue = this.editForm.getRawValue();
    this.selectedPoint.name = formValue.name;
    this.selectedPoint.image = formValue.image;
    this.updateLocalStorage();
  }

  moveSelectedPoint() {
    if (!this.selectedPoint) {
      return;
    }
    this.movePoint = true;
    // Hold on to selected point while we delete it from the list
    const selectedPoint = this.selectedPoint;
    this.deleteSelectedPoint();
    this.selectedPoint = selectedPoint;
  }

  cancelMove() {
    if (!this.selectedPoint || !this.movePoint) {
      return;
    }
    this.points.push(this.selectedPoint);
    this.movePoint = false;
  }

  updatePointerPosition() {
    const chartPosition = this.getChartPosition();
    const chartSize = this.getChartSize();
    
    if (this.mouseX < chartPosition.x ||
      this.mouseX > chartPosition.x + chartSize.width ||
      this.mouseY < chartPosition.y ||
      this.mouseY > chartPosition.y + chartSize.height
    ) {
      this.newPointPositionStyle = {
        left: "0",
        top: "0",
        visibility: "hidden",        
      }
      return;
    }

    const left = this.mouseX - chartPosition.x;
    const top = this.mouseY - chartPosition.y;
    
    this.newPointPositionStyle = {
      left: left + "px",
      top: top + "px",
      visibility: "visible",        
    };
  }

  getChartPosition() {
    const x = this.getElDistToLeft(this.chartElement.nativeElement);
    const y = this.getElDistToTop(this.chartElement.nativeElement);
    return { x, y };
  }

  getChartSize() {
    const height = this.chartElement.nativeElement.clientHeight;
    const width = this.chartElement.nativeElement.clientWidth;
    return { height, width };
  }

  getElDistToLeft(element: HTMLElement) {
    return window.scrollX + element.getBoundingClientRect().left;
  }

  getElDistToTop(element: HTMLElement) {
    return window.scrollY + element.getBoundingClientRect().top;
  }

  chartClick(e: MouseEvent) {
    if (this.newPoint) {
      this.addNewPoint();
      return;
    }
    if (this.movePoint && this.selectedPoint) {
      this.addPointAtMousePos(this.selectedPoint);
      this.updateLocalStorage();
      this.movePoint = false;
      return;
    }
    if (e.target === this.chartElement.nativeElement) {
      this.selectedPoint = undefined;
    }
  }

  toggleNewPointMode() {
    this.selectedPoint = undefined;
    this.newPoint = !this.newPoint;
  }

  toggleShowPointNames() {
    this.showPointNames = !this.showPointNames;
  }

  addNewPoint() {
    const newPoint: Point = {
      name: "New point",
      image: null,
      pointStyle: {
        left: "0",
        top: "0",
        visibility: "hidden"
      }
    };
    this.addPointAtMousePos(newPoint);
  }

  addPointAtMousePos(point: Point) {
    const chartPosition = this.getChartPosition();

    const left = this.mouseX - chartPosition.x;
    const top = this.mouseY - chartPosition.y;

    point.pointStyle = {
      left: left + "px",
      top: top + "px",
      visibility: "visible"
    };

    this.points.push(point);
    this.updateLocalStorage();
    this.selectedPoint = point;

    this.newPoint = false;
  }

  updateLocalStorage() {    
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(this.points));
  }
}

interface Point {
  image: EditableImage | null;
  name: string;
  pointStyle: PointStyle;
}

interface PointStyle {
  left: string;
  top: string;
  visibility: "hidden" | "visible";
}
