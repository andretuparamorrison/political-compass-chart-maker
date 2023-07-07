import { EditableImage } from "./editable-image.model";

export function getImageStyle(image: EditableImage, containerWidth: number) {
    const scaleFactor = image.zoom/10;
    const translationFactor = containerWidth/2;
    return {
      transform: `translateX(calc(${-image.scrollX}/100*(50% * ${scaleFactor} - ${translationFactor}px))) ` +
        `translateY(calc(${image.scrollY}/100*(50% * ${scaleFactor} - ${translationFactor}px))) ` + 
        `scale(${scaleFactor})`
    };
}