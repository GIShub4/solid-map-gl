import { describe, it, expect, afterEach } from "vitest";
import { cleanup } from "@solidjs/testing-library";
import { Atmosphere } from "./index";
import { renderWithMap } from "../../testUtils/renderWithMap";

afterEach(cleanup);

describe("Atmosphere", () => {
  it("calls setFog on the Mapbox path", () => {
    const { map } = renderWithMap(() => <Atmosphere style={{ range: [1, 10] }} />, {
      isMapLibre: false,
    });
    expect(map.setFog).toHaveBeenCalledWith({ range: [1, 10] });
    expect((map as any).setSky).toBeUndefined();
  });

  it("removes fog on cleanup only if fog was set (Mapbox path)", () => {
    const { map, unmount } = renderWithMap(() => <Atmosphere style={{ range: [1, 10] }} />, {
      isMapLibre: false,
    });
    unmount();
    expect(map.setFog).toHaveBeenLastCalledWith(null);
  });

  // MapLibre has its own, differently-shaped `sky` API — this can't reuse
  // setFog()/FogSpecification.
  it("calls setSky with MapLibre-shaped properties on the MapLibre path", () => {
    const { map } = renderWithMap(
      () => <Atmosphere style={{ "sky-color": "#fff", "horizon-color": "#000" } as any} />,
      { isMapLibre: true },
    );
    expect((map as any).setSky).toHaveBeenCalledWith({
      "sky-color": "#fff",
      "horizon-color": "#000",
    });
    expect((map as any).setFog).toBeUndefined();
  });

  it("removes sky on cleanup only if sky was set (MapLibre path)", () => {
    const { map, unmount } = renderWithMap(
      () => <Atmosphere style={{ "sky-color": "#fff" } as any} />,
      { isMapLibre: true },
    );
    unmount();
    expect((map as any).setSky).toHaveBeenLastCalledWith(null);
  });

  it("defaults to an empty object when no style is given (Mapbox path)", () => {
    const { map } = renderWithMap(() => <Atmosphere />, { isMapLibre: false });
    expect(map.setFog).toHaveBeenCalledWith({});
  });

  it("defaults to an empty object when no style is given (MapLibre path)", () => {
    const { map } = renderWithMap(() => <Atmosphere />, { isMapLibre: true });
    expect((map as any).setSky).toHaveBeenCalledWith({});
  });

  it("does not call setFog(null) on cleanup if fog was never actually set (Mapbox path)", () => {
    const { map, unmount } = renderWithMap(() => <Atmosphere style={{ range: [1, 10] }} />, {
      isMapLibre: false,
    });
    map.setFog.mockClear();
    map.getFog.mockReturnValue(null);
    unmount();
    expect(map.setFog).not.toHaveBeenCalled();
  });

  it("does not call setSky(null) on cleanup if sky was never actually set (MapLibre path)", () => {
    const { map, unmount } = renderWithMap(
      () => <Atmosphere style={{ "sky-color": "#fff" } as any} />,
      { isMapLibre: true },
    );
    (map as any).setSky.mockClear();
    (map as any).getSky.mockReturnValue(null);
    unmount();
    expect((map as any).setSky).not.toHaveBeenCalled();
  });
});
