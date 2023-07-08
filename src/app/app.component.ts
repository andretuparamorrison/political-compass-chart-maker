import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { EditableImage } from './editable-image/editable-image.model';
import { getImageStyle } from './editable-image/editable-image.helper';

const CHART_IDS_KEY = "political-compass-chart-ids" as const;
const LAST_SELECTED_ID_KEY = "political-compass-chart-last-selected-id" as const;
const POINTS_KEY_PREFIX = "political-compass-chart-points/" as const;

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

  loadFormControl = this.fb.control(null as string | null);

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

  newPointPlaceholder: Point = {
    image: null,
    name: "New point",
    visibility: "hidden",
    x: 0,
    y: 0,
  };

  editPointMode: boolean = false;
  movePointMode: boolean = false;
  newPointMode: boolean = false;
  showPointNames: boolean = false;

  chartIds: string[] = [];
  loadedChartId?: string; 

  points: Point[] = [];
  selectedPoint?: Point;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.loadSavedData();
  }

  loadSavedData() {
    const chartIds = localStorage.getItem(CHART_IDS_KEY);
    if (!chartIds) {
      return;
    }
    this.chartIds = JSON.parse(chartIds);
    const lastSelectedId = localStorage.getItem(LAST_SELECTED_ID_KEY);
    if (!lastSelectedId) {
      return;
    }
    this.loadChart(lastSelectedId);
  }

  newChart() {
    let name: string | null = null;
    do {
      name = prompt("Please specify a name: ");
      if (!name) {
        return;
      }
    } while (this.chartIds.includes(name));
    this.updateLocalStorage();
    this.chartIds.push(name);
    this.loadedChartId = name;
    this.loadFormControl.setValue(name);
    this.points = [];
    this.updateLocalStorage();
  }

  deleteClicked() {
    const selectedChartId = this.loadFormControl.value;
    if (!selectedChartId) {
      return;
    }
    if (!confirm(`Are you sure you want to delete "${selectedChartId}"?`)) {
      return;
    }
    this.deleteChart(selectedChartId);
  }

  deleteChart(chartId: string) {
    const chartIndex = this.chartIds.indexOf(chartId);
    if (chartIndex === -1) {
      return;
    }
    this.chartIds.splice(chartIndex, 1);
    if (chartId === this.loadedChartId) {
      this.loadedChartId = this.chartIds.at(0);
    }
    if (this.loadedChartId) {
      this.loadFormControl.setValue(this.loadedChartId);
    }
    this.updateLocalStorage();
  }

  loadClicked() {
    const selectedChartId = this.loadFormControl.value;
    if (selectedChartId) {
      this.loadChart(selectedChartId);
    }
  }

  loadChart(chartId: string) {
    const points = localStorage.getItem(POINTS_KEY_PREFIX + chartId);
    if (!points) {
      this.deleteChart(chartId);
      if (this.chartIds.length) {
        this.loadChart(this.chartIds[0]);
      }
      return;
    }
    this.points = JSON.parse(points);
    this.loadedChartId = chartId;
    this.loadFormControl.setValue(chartId);
    localStorage.setItem(LAST_SELECTED_ID_KEY, this.loadedChartId);
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

  getPointStyle(point: Point) {
    return {
      left: 100*point.x + "%",
      top: 100*point.y + "%",
      visibility: point.visibility,
    };
  }

  pointClick(index: number) {
    if (this.newPointMode) {
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
    this.editPointMode = true;
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
    this.editPointMode = false;
  }

  saveEdit() {
    this.editPointMode = false;
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
    this.movePointMode = true;
    // Hold on to selected point while we delete it from the list
    const selectedPoint = this.selectedPoint;
    this.deleteSelectedPoint();
    this.selectedPoint = selectedPoint;
  }

  cancelMove() {
    if (!this.selectedPoint || !this.movePointMode) {
      return;
    }
    this.points.push(this.selectedPoint);
    this.movePointMode = false;
  }

  updatePointerPosition() {
    const chartPosition = this.getChartPosition();
    const chartSize = this.getChartSize();
    
    if (this.mouseX < chartPosition.x ||
      this.mouseX > chartPosition.x + chartSize.width ||
      this.mouseY < chartPosition.y ||
      this.mouseY > chartPosition.y + chartSize.height
    ) {
      this.newPointPlaceholder.visibility = "hidden";
      return;
    }

    this.setPointPositionToMouse(this.newPointPlaceholder);
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

  getElDistToRight(element: HTMLElement) {
    return window.scrollX + element.getBoundingClientRect().right;
  }

  getElDistToTop(element: HTMLElement) {
    return window.scrollY + element.getBoundingClientRect().top;
  }

  getElDistToBottom(element: HTMLElement) {
    return window.scrollY + element.getBoundingClientRect().bottom;
  }

  chartClick(e: MouseEvent) {
    if (this.newPointMode) {
      this.addNewPoint();
      return;
    }
    if (this.movePointMode && this.selectedPoint) {
      this.addPointAtMousePos(this.selectedPoint);
      this.updateLocalStorage();
      this.movePointMode = false;
      return;
    }
    if (e.target === this.chartElement.nativeElement) {
      this.selectedPoint = undefined;
    }
  }

  toggleNewPointMode() {
    this.selectedPoint = undefined;
    this.newPointMode = !this.newPointMode;
  }

  toggleShowPointNames() {
    this.showPointNames = !this.showPointNames;
  }

  addNewPoint() {
    const newPointMode: Point = {
      name: "New point",
      image: null,
      visibility: "hidden",
      x: 0,
      y: 0,
    };
    this.addPointAtMousePos(newPointMode);
  }

  addPointAtMousePos(point: Point) {
    this.setPointPositionToMouse(point);

    this.points.push(point);
    this.updateLocalStorage();
    this.selectedPoint = point;

    this.newPointMode = false;
  }

  setPointPositionToMouse(point: Point) {
    const chartPosition = this.getChartPosition();
    const chartSize = this.getChartSize();
    point.visibility = "visible";
    point.x = (this.mouseX - chartPosition.x) / chartSize.width;
    point.y = (this.mouseY - chartPosition.y) / chartSize.height;
  }

  updateLocalStorage() {    
    localStorage.setItem(CHART_IDS_KEY, JSON.stringify(this.chartIds));
    if (this.loadedChartId) {
      localStorage.setItem(LAST_SELECTED_ID_KEY, this.loadedChartId);
      localStorage.setItem(POINTS_KEY_PREFIX + this.loadedChartId, JSON.stringify(this.points));
    }
  }
}

interface Point {
  image: EditableImage | null;
  name: string;
  visibility: "hidden" | "visible";
  x: number;
  y: number;
}
