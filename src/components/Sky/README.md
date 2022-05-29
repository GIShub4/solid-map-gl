---
description: Sky Layer Component
---

# Sky

## Props

| Name    | Type    | Description                                                                    |
| ------- | ------- | ------------------------------------------------------------------------------ |
| style\* | object  | [Sky style specs](https://docs.mapbox.com/mapbox-gl-js/style-spec/layers/#sky) |
| visible | boolean | Show / Hide Layer                                                              |

_\*required_

## Example

```jsx
const Map: Component = () => {
  const [viewport, setViewport] = createSignal({
    center: [0, 0],
    zoom: 6,
  } as Viewport);

  return (
    <MapGL
      options={{
        accessToken: MAPBOX_ACCESS_TOKEN,
        style: "mb:light",
      }}
      viewport={viewport()}
      onViewportChange={(evt: Event) => setViewport(evt)}
    >
      <Sky
        style={{
          type: "sky",
          paint: {
            "sky-type": "gradient",
            "sky-opacity-transition": { duration: 500 },
          },
        }}
      />
    </MapGL>
  );
};
```
