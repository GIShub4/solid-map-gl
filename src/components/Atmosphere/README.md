---
description: Enhance your map with atmospheric effects using the Atmosphere component.
---

# Atmosphere

The Atmosphere component allows you to add and customize atmospheric effects like fog, helping to set the mood or highlight certain areas on your map. It provides an easy way to control the appearance of the atmosphere using a declarative syntax.

## Props

The component accepts the following properties (props):

| Name  | Type   | Description                                                            | Default |
| ----- | ------ | ---------------------------------------------------------------------- | ------- |
| style | object | An object specifying the style properties of the atmosphere element according to Mapbox's [Atmosphere style specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/atmosphere). | `{}` (The default atmosphere style used by the map style) |

> Note: All properties are optional. If omitted, the map's default atmosphere style will be applied.

## Example

To utilize the Atmosphere component, import it from `solid-map-gl` and include it within your `MapGL` component. Below is a simple example demonstrating how to add the Atmosphere component to your map and specify its style properties:

```jsx
import { Component, createSignal } from "solid-js";
import MapGL, { Viewport, Atmosphere } from "solid-map-gl";
import 'mapbox-gl/dist/mapbox-gl.css';

const App: Component = () => {
  // Create a state hook for the viewport settings
  const [viewport, setViewport] = createSignal({
    center: [0, 52], // Longitude, Latitude
    zoom: 6,         // Zoom level
    pitch: 100       // Map pitch in degrees
  } as Viewport);

  // Define the style for the atmosphere effect
  const atmosphereStyle = {
    color: 'white',        // The color of the fog
    horizonBlend: 0.1,     // Blend factor of the fog over the horizon line
    intensity: 0.5         // The intensity of the fog
  };

  // Render the map with the Atmosphere component
  return (
    <MapGL
      options={{ style: 'mb:sat_street' }}                 // Map style URI
      viewport={viewport()}                                // Viewport state
      onViewportChange={(newViewport: Viewport) => setViewport(newViewport)} // Handler for viewport changes
    >
      <Atmosphere style={atmosphereStyle} />              // Atmosphere component with custom style
    </MapGL>
  );
};
```

Through this example, the `Atmosphere` component is applied to the map, enhancing the visual depth and adding an ethereal effect that blends the horizon with the sky. Customize the `atmosphereStyle` object to experiment with different looks and find the perfect ambiance for your map.
